import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
} from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";
import { Video } from "./provider.ts";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["app", "player"]);

export enum PlayerStatus {
  Stopped,
  Idle,
  Paused,
  Playing,
}

export class Player {
  private readonly audioPlayer: AudioPlayer;
  private musicInQueue: Video[] = [];
  status: PlayerStatus;
  protected broadcastChannelID: string;

  private readonly connection: VoiceConnection | null;
  private currentPlayingMusic:
    | { resource: AudioResource; video: Video }
    | null = null;

  constructor(connection: VoiceConnection, broadcastChannelId: string) {
    this.status = PlayerStatus.Idle;

    this.connection = connection;
    this.broadcastChannelID = broadcastChannelId;

    this.audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    // define events
    this.audioPlayer.on(
      AudioPlayerStatus.Idle,
      () => this.playerIdle(),
    );
    this.audioPlayer.on(
      AudioPlayerStatus.Buffering,
      () => this.playerBuffering(),
    );
    this.audioPlayer.on(
      AudioPlayerStatus.Playing,
      () => this.playerPlaying(),
    );
    this.audioPlayer.on(
      AudioPlayerStatus.Paused,
      () => this.playerPaused(),
    );
  }

  public static createPlayer(
    voiceChannel: VoiceBasedChannel,
    broadcastChannelId: string,
    guildId: string,
  ): Player {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const player = new Player(connection, broadcastChannelId);
    player_storage.set(guildId, player);

    return player;
  }

  //  ====================================================
  //
  //    EVENTS
  //
  //  ====================================================

  /**
   * Idle - the initial state of an audio player. The audio player will be in this state when there is no audio resource for it to play.
   * @private
   */
  private async playerIdle() {
    // By default, the `currentPlayingResource` is null; in this configuration, it means that no music as been played.
    // Therefore, we don't need to pass to the next music
    if (!this.currentPlayingMusic) {
      this.status = PlayerStatus.Idle;
      return;
    }

    if (this.musicInQueue.length > 0 && this.status !== PlayerStatus.Stopped) {
      await this.playMusic(this.musicInQueue.shift()!);
    } else {
      this.status = PlayerStatus.Idle;
      this.currentPlayingMusic = null;
    }
  }

  /**
   * Buffering - the state an audio player will be in while it is waiting for an audio resource to become playable. The audio player may transition from this state to either the Playing state (success) or the Idle state (failure).
   * @private
   */
  private playerBuffering() {
    console.log("player buffering");
  }

  /**
   * Playing - the state a voice connection enters when it is actively playing an audio resource. When the audio resource comes to an end, the audio player will transition to the Idle state.
   */
  private playerPlaying() {
    this.status = PlayerStatus.Playing;
    console.log("player playing");
  }

  /**
   * Paused - the state a voice connection enters when it is paused by the user.
   * @private
   */
  private playerPaused() {
    this.status = PlayerStatus.Paused;
    console.log("player paused");
  }

  //  ====================================================
  //
  //    INTERNAL FUNCTIONS
  //
  //  ====================================================

  private async playMusic(video: Video) {
    if (!this.connection) {
      logger.error("No voice connection found when trying to play music");
      return;
    }

    try {
      const resource = await video.getStream();
      this.currentPlayingMusic = { resource, video };

      this.audioPlayer.play(resource);
      this.connection!.subscribe(this.audioPlayer);
    } catch (error) {
      logger.error("Error while playing music: {error}", { error });
      this.currentPlayingMusic = null;
    }
  }

  //  ====================================================
  //
  //    PUBLIC INTERFACES
  //
  //  ====================================================

  addMusic(video: Video) {
    console.log("video", video);
    console.log("currentPlayingMusic", this.currentPlayingMusic);
    this.musicInQueue.push(video);
    // We check if music is already playing
    if (!this.currentPlayingMusic) {
      // If no music is playing, then we can play the first music in the queue
      this.playMusic(this.musicInQueue.shift()!);
    }
  }

  resume() {
    this.audioPlayer.unpause();
  }

  pause() {
    this.audioPlayer.pause();
  }

  stop() {
    this.status = PlayerStatus.Stopped;
    this.audioPlayer.stop();
  }
}

/**
 * Stores all players based on the guild ID
 */
export const player_storage: Map<string, Player> = new Map();
