// backend/src/routes/propertyOwners.routes.ts
import { Router } from 'express';
import propertyOwnersController from '../controllers/propertyOwners.controller';
import { authenticate, authenticateOwner } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();

// ========== АДМИНСКИЕ ЭНДПОИНТЫ ==========
// Создание доступа для владельца (только для админов)
router.post(
  '/create',
  authenticate,
  validateRequest({
    required: ['owner_name']
  }),
  propertyOwnersController.createOwnerAccess.bind(propertyOwnersController)
);

// Получить информацию о доступе владельца (только для админов)
router.get(
  '/info/:ownerName',
  authenticate,
  propertyOwnersController.getOwnerInfo.bind(propertyOwnersController)
);

// ========== ПУБЛИЧНЫЕ ЭНДПОИНТЫ ==========
// Проверка токена владельца (без авторизации)
router.get(
  '/verify/:token',
  propertyOwnersController.verifyOwnerToken.bind(propertyOwnersController)
);

// Авторизация владельца
router.post(
  '/login',
  validateRequest({
    required: ['access_token', 'password']
  }),
  propertyOwnersController.login.bind(propertyOwnersController)
);

// Обновление токена
router.post(
  '/refresh',
  validateRequest({
    required: ['refreshToken']
  }),
  propertyOwnersController.refreshToken.bind(propertyOwnersController)
);

// ========== ЭНДПОИНТЫ ДЛЯ АВТОРИЗОВАННЫХ ВЛАДЕЛЬЦЕВ ==========
router.use(authenticateOwner); // Все роуты ниже требуют авторизации владельца

// Получить список объектов владельца
router.get(
  '/properties',
  propertyOwnersController.getOwnerProperties.bind(propertyOwnersController)
);

// Смена пароля
router.post(
  '/change-password',
  validateRequest({
    required: ['current_password', 'new_password']
  }),
  propertyOwnersController.changePassword.bind(propertyOwnersController)
);

export default router;