
import { WebDriver } from 'selenium-webdriver';

export type SessionId = string;
export type Driver = WebDriver;

export interface ServerState {
    drivers: Map<SessionId, Driver>;
    currentSession: SessionId | null;
}

export const state: ServerState = {
    drivers: new Map(),
    currentSession: null
};
