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

export class Player {
  private readonly audioPlayer: AudioPlayer;
  private musicInQueue: Video[] = [];

  private readonly connection: VoiceConnection | null;
  private currentPlayingMusic:
    | { resource: AudioResource; video: Video }
    | null = null;

  protected broadcastChannelID: string;

  constructor(connection: VoiceConnection, broadcastChannelId: string) {
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
  private playerIdle() {
    console.log("player idle");
    // By default, the `currentPlayingResource` is null; in this configuration, it means that no music as been played.
    // Therefore, we don't need to pass to the next music
    if (!this.currentPlayingMusic) return;

    if (this.musicInQueue.length > 0) {
      this.playMusic(this.musicInQueue.pop()!);
    } else {
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
    console.log("player playing");
  }

  /**
   * Paused - the state a voice connection enters when it is paused by the user.
   * @private
   */
  private playerPaused() {
    console.log("player paused");
  }

  //  ====================================================
  //
  //    INTERNAL FUNCTIONS
  //
  //  ====================================================

  private playMusic(video: Video) {
    if (!this.connection) {
      logger.error("No voice connection found when trying to play music");
      return;
    }

    const resource = video.getStream();
    this.currentPlayingMusic = { resource, video };

    this.audioPlayer.play(resource);
    this.connection!.subscribe(this.audioPlayer);
  }

  //  ====================================================
  //
  //    PUBLIC INTERFACES
  //
  //  ====================================================

  addMusic(video: Video) {
    this.musicInQueue.push(video);
    // We check if music is already playing
    if (!this.currentPlayingMusic) {
      // If no music is playing, then we can play the first music in the queue
      this.playMusic(this.musicInQueue.pop()!);
    }
  }

  resume() {
    this.audioPlayer.unpause();
  }

  pause() {
    this.audioPlayer.pause();
  }

  stop() {
    this.audioPlayer.stop();
  }
}

/**
 * Stores all players based on the guild ID
 */
export const player_storage: Map<string, Player> = new Map();
