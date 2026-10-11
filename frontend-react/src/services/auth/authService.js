import { login as coreLogin, register as coreRegister } from '../authService';

/**
 * Backward-compatible login export for existing components.
 */
export async function login(email, password) {
  return coreLogin(email, password);
}

/**
 * Backward-compatible register export for existing components.
 */
export async function register(userData) {
  return coreRegister(userData);
}

export default {
  login,
  register,
};