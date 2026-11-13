import {
  login as coreLogin,
  register as coreRegister,
  forgotPassword as coreForgotPassword,
  resetPassword as coreResetPassword,
  findAccount as coreFindAccount,
} from '../authService';

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

/**
 * Request password recovery code for registered email.
 */
export async function forgotPassword(email) {
  return coreForgotPassword(email);
}

/**
 * Reset password with verification code.
 */
export async function resetPassword(payload) {
  return coreResetPassword(payload);
}

/**
 * Find registered account / login email by phone number.
 */
export async function findAccount(phone) {
  return coreFindAccount(phone);
}

export default {
  login,
  register,
  forgotPassword,
  resetPassword,
  findAccount,
};
