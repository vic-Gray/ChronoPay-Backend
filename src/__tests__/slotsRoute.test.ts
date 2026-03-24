/**
 *
 * Integration tests for GET /api/v1/slots and POST /api/v1/slots.
 */

import { jest } from "@jest/globals";
import request from "supertest";
import app from "../index.js";
import { setRedisClient, type RedisClient } from "../cache/redisClient.js";
import { resetSlotStore } from "../routes/slots.js";

// ─── Mock factory ─────────────────────────────────────────────

function makeMockRedis(
  overrides: Partial<jest.Mocked<RedisClient>> = {},
): jest.Mocked<RedisClient> {
  return {
    get: jest.fn<RedisClient["get"]>().mockResolvedValue(null),
    set: jest.fn<RedisClient["set"]>().mockResolvedValue("OK"),
    del: jest.fn<RedisClient["del"]>().mockResolvedValue(1),
    quit: jest.fn<RedisClient["quit"]>().mockResolvedValue("OK"),
    ...overrides,
  };
}

const CACHED_SLOTS = [
  {
    id: 99,
    professional: "Dr. Cached",
    startTime: "2024-06-01T08:00:00Z",
    endTime: "2024-06-01T08:30:00Z",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  resetSlotStore();
});

afterEach(() => {
  setRedisClient(null);
});

// ─────────────────────────────────────────────
// GET /api/v1/slots
// ─────────────────────────────────────────────

describe("GET /api/v1/slots", () => {
  it("returns 200 with empty array by default", async () => {
    setRedisClient(makeMockRedis());

    const res = await request(app).get("/api/v1/slots");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ slots: [] });
  });

  it("sets X-Cache MISS", async () => {
    setRedisClient(
      makeMockRedis({
        get: jest.fn<RedisClient["get"]>().mockResolvedValue(null),
      }),
    );

    const res = await request(app).get("/api/v1/slots");

    expect(res.headers["x-cache"]).toBe("MISS");
  });

  it("calls redis.set after miss", async () => {
    const redis = makeMockRedis({
      get: jest.fn<RedisClient["get"]>().mockResolvedValue(null),
    });

    setRedisClient(redis);

    await request(app).get("/api/v1/slots");

    expect(redis.set).toHaveBeenCalledTimes(1);

    const [key, value, exMode] = redis.set.mock.calls[0];

    expect(key).toBe("slots:all");
    expect(JSON.parse(value as string)).toEqual([]);
    expect(exMode).toBe("EX");
  });

  it("returns HIT from cache", async () => {
    const redis = makeMockRedis({
      get: jest
        .fn<RedisClient["get"]>()
        .mockResolvedValue(JSON.stringify(CACHED_SLOTS)),
    });

    setRedisClient(redis);

    const res = await request(app).get("/api/v1/slots");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ slots: CACHED_SLOTS });
    expect(res.headers["x-cache"]).toBe("HIT");

    expect(redis.set).not.toHaveBeenCalled();
  });

  it("graceful when Redis down", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const redis = makeMockRedis({
      get: jest
        .fn<RedisClient["get"]>()
        .mockRejectedValue(new Error("ECONNREFUSED")),

      set: jest
        .fn<RedisClient["set"]>()
        .mockRejectedValue(new Error("ECONNREFUSED")),
    });

    setRedisClient(redis);

    const res = await request(app).get("/api/v1/slots");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("slots");

    consoleSpy.mockRestore();
  });

  it("works without Redis", async () => {
    setRedisClient(null);

    const res = await request(app).get("/api/v1/slots");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ slots: [] });
    expect(res.headers["x-cache"]).toBe("MISS");
  });

  it("reflects created slot", async () => {
    setRedisClient(makeMockRedis());

    await request(app).post("/api/v1/slots").send({
      professional: "Dr. Live",
      startTime: "2024-07-01T09:00:00Z",
      endTime: "2024-07-01T09:30:00Z",
    });

    const res = await request(app).get("/api/v1/slots");

    expect(res.status).toBe(200);
    expect(res.body.slots).toHaveLength(1);
    expect(res.body.slots[0].professional).toBe("Dr. Live");
  });
});

// ─────────────────────────────────────────────
// POST /api/v1/slots
// ─────────────────────────────────────────────

describe("POST /api/v1/slots", () => {
  const VALID_BODY = {
    professional: "Dr. Test",
    startTime: "2024-03-15T14:00:00Z",
    endTime: "2024-03-15T14:30:00Z",
  };

  it("creates slot", async () => {
    setRedisClient(makeMockRedis());

    const res = await request(app).post("/api/v1/slots").send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.slot.id).toBe("number");
  });

  it("invalidates cache", async () => {
    const redis = makeMockRedis();

    setRedisClient(redis);

    await request(app).post("/api/v1/slots").send(VALID_BODY);

    expect(redis.del).toHaveBeenCalledWith("slots:all");
  });

  it("auto increment ids", async () => {
    setRedisClient(makeMockRedis());

    const r1 = await request(app).post("/api/v1/slots").send(VALID_BODY);
    const r2 = await request(app).post("/api/v1/slots").send(VALID_BODY);

    expect(r1.body.slot.id).toBe(1);
    expect(r2.body.slot.id).toBe(2);
  });

  it("400 missing professional", async () => {
    setRedisClient(makeMockRedis());

    const res = await request(app).post("/api/v1/slots").send({
      startTime: "2024",
      endTime: "2024",
    });

    expect(res.status).toBe(400);
  });

  it("400 missing startTime", async () => {
    setRedisClient(makeMockRedis());

    const res = await request(app).post("/api/v1/slots").send({
      professional: "Dr",
      endTime: "2024",
    });

    expect(res.status).toBe(400);
  });

  it("400 missing endTime", async () => {
    setRedisClient(makeMockRedis());

    const res = await request(app).post("/api/v1/slots").send({
      professional: "Dr",
      startTime: "2024",
    });

    expect(res.status).toBe(400);
  });

  it("still works if del fails", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const redis = makeMockRedis({
      del: jest
        .fn<RedisClient["del"]>()
        .mockRejectedValue(new Error("ECONNREFUSED")),
    });

    setRedisClient(redis);

    const res = await request(app).post("/api/v1/slots").send(VALID_BODY);

    expect(res.status).toBe(201);

    consoleSpy.mockRestore();
  });

  it("works without Redis", async () => {
    setRedisClient(null);

    const res = await request(app).post("/api/v1/slots").send(VALID_BODY);

    expect(res.status).toBe(201);
  });
});

// ─────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────

describe("GET /health", () => {
  it("ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);

    expect(res.body).toEqual({
      status: "ok",
      service: "chronopay-backend",
    });
  });
});