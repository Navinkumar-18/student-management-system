export const isLoginAllowedEmail = (email = '') => {
  return String(email).trim().toLowerCase().endsWith('@gmail.com');
};

export const loginAllowedEmailMessage = 'Please enter a proper professional mail id ending with @gmail.com';
