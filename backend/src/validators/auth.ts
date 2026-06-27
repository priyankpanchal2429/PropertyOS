import { body } from 'express-validator';

export const loginValidator = [
  body('usernameOrEmail')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username or email must be between 3 and 100 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];
