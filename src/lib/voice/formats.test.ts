import { describe, expect, it } from "vitest";

import {
  containerFor,
  contentTypeFor,
  parseVoiceNotePath,
  pickRecorderMime,
  voiceNotePath,
} from "./formats";

const agent = "8fb14d11-1111-4222-8333-444455556666";
const file = "0a1b2c3d-4e5f-4061-8172-839405a6b7c8";

describe("pickRecorderMime", () => {
  it("prefers webm/Opus, then mp4", () => {
    expect(pickRecorderMime(() => true)).toBe("audio/webm;codecs=opus");
    expect(pickRecorderMime((m) => m === "audio/mp4")).toBe("audio/mp4");
  });

  it("returns null when nothing is supported, even if the check throws", () => {
    expect(pickRecorderMime(() => false)).toBeNull();
    expect(
      pickRecorderMime(() => {
        throw new Error("unknown type");
      })
    ).toBeNull();
  });
});

describe("containerFor", () => {
  it("maps recorder types to a container, ignoring codecs", () => {
    expect(containerFor("audio/webm;codecs=opus")).toBe("webm");
    expect(containerFor("audio/mp4")).toBe("m4a");
    expect(containerFor("audio/mp4;codecs=mp4a.40.2")).toBe("m4a");
    expect(containerFor("AUDIO/WEBM")).toBe("webm");
  });

  it("rejects anything else", () => {
    expect(containerFor("video/mp4")).toBeNull();
    expect(containerFor("")).toBeNull();
    expect(containerFor(null)).toBeNull();
  });

  it("gives an upload type per container", () => {
    expect(contentTypeFor("webm")).toBe("audio/webm");
    expect(contentTypeFor("m4a")).toBe("audio/mp4");
  });
});

describe("voice note paths", () => {
  it("round-trips the agent's own path", () => {
    const path = voiceNotePath(agent, file, "m4a");
    expect(path).toBe(`${agent}/voice-notes/${file}.m4a`);
    expect(parseVoiceNotePath(path, agent)).toBe("m4a");
  });

  it("refuses another agent's folder, other folders and odd names", () => {
    const other = "99999999-1111-4222-8333-444455556666";
    expect(parseVoiceNotePath(voiceNotePath(other, file, "webm"), agent)).toBeNull();
    expect(parseVoiceNotePath(`${agent}/documents/${file}.webm`, agent)).toBeNull();
    expect(parseVoiceNotePath(`${agent}/voice-notes/../x/${file}.webm`, agent)).toBeNull();
    expect(parseVoiceNotePath(`${agent}/voice-notes/${file}.mp3`, agent)).toBeNull();
    expect(parseVoiceNotePath(`${agent}/voice-notes/note.webm`, agent)).toBeNull();
  });
});
