
import { WebDriver } from 'selenium-webdriver';

export type SessionId = string;
export type Driver = WebDriver;

export interface SessionOptions {
    preserveNetworkLogs?: boolean;
}

export interface ServerState {
    drivers: Map<SessionId, Driver>;
    currentSession: SessionId | null;
    sessionOptions: Map<SessionId, SessionOptions>;
}

export const state: ServerState = {
    drivers: new Map(),
    currentSession: null,
    sessionOptions: new Map()
};
