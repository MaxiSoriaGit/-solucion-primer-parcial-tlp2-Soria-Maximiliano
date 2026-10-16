// * ARCHIVO A COMPLETAR
import { body } from 'express-validator';
import { Op } from 'sequelize';
import {
  ProjectModel,
  TechnologyModel,
  UserModel,
} from '../../models/index.js';

// Formato de code elegido: PRJ- seguido de 3 a 6 dígitos (ej: PRJ-001).
const CODE_REGEX = /^PRJ-\d{3,6}$/;
const STATUSES = ['planning', 'in_progress', 'paused', 'finished'];
// * Unicidad de code. En la edición (hay :id en la ruta) se excluye el propio proyecto.
const isCodeUnique = async (code, { req }) => {
  const where = { code };
  if (req.params?.id) where.id = { [Op.ne]: req.params.id };

  const found = await ProjectModel.findOne({ where });

  if (found) {
    throw new Error('El code ya está en uso');
  }

  return true;
};
// * findByPk ya excluye a los usuarios eliminados lógicamente (paranoid),
// * por eso un usuario borrado no puede ser líder.
const isActiveUser = async (leaderId) => {
  const user = await UserModel.findByPk(leaderId);
  if (!user) throw new Error('El líder debe ser un usuario existente y activo');
  return true;
};

// * Debe ser un array de ids enteros positivos y todos deben existir.
const technologiesExist = async (ids) => {
  if (!Array.isArray(ids)) {
    throw new Error('technologies debe ser un array de ids');
  }
  if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
    throw new Error('technologies solo puede contener ids enteros positivos');
  }

  const uniqueIds = [...new Set(ids)];
  const found = await TechnologyModel.count({ where: { id: uniqueIds } });
  if (found !== uniqueIds.length) {
    throw new Error('Alguna de las technologies indicadas no existe');
  }
  return true;
};

export const createProjectValidation = [
  // TODO: 1. Validar code: obligatorio y único (ProjectModel).
  body('code')
    .exists()
    .withMessage('El code es obligatorio')
    .bail()
    .trim()
    .matches(CODE_REGEX)
    .withMessage('El code no tiene el formato correcto')
    .bail()
    .custom(isCodeUnique),
  // TODO: 2. Validar name y description como obligatorios.
  body('name')
    .exists()
    .withMessage('El name es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El name debe tener entre 2 y 100 caracteres'),
  body('description').exists().withMessage('La description es obligatoria'),
  // TODO: 3. Validar status: opcional y limitado a los estados permitidos.
  body('status')
    .optional()
    .isIn(STATUSES)
    .withMessage('El status no es válido'),
  // TODO: 4. Validar start_date como fecha válida y budget como número positivo, ambos obligatorios.
  body('start_date')
    .exists()
    .withMessage('La start_date es obligatoria')
    .isDate()
    .withMessage('La start_date no es una fecha válida'),
  body('budget')
    .exists()
    .withMessage('El budget es obligatorio')
    .isFloat({ gt: 0 })
    .withMessage('El budget debe ser un número positivo'),
  // TODO: 5. Validar leader_id: debe existir y pertenecer a un usuario activo (UserModel).
  body('leader_id')
    .exists()
    .withMessage('El leader_id es obligatorio')
    .bail()
    .isInt({ gt: 0 })
    .withMessage('El leader_id debe ser un id entero positivo')
    .bail()
    .custom(isActiveUser),
  // TODO: 6. Validar technologies: lista de ids que existan (TechnologyModel).
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Las technologies deben ser una lista')
    .bail()
    .custom(technologiesExist),
];

// ? Un usuario eliminado lógicamente no puede ser líder: comprobar que la búsqueda lo deje afuera.

export const updateProjectValidation = [
  // TODO: 7. Validar code como opcional y único, excluyendo el propio proyecto que se edita.
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El code no puede estar vacío')
    .bail()
    .matches(CODE_REGEX)
    .withMessage('El code debe tener el formato PRJ-001')
    .bail()
    .custom(isCodeUnique),

  // TODO: 8. Validar name y description como opcionales y no vacíos.
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La descripción no puede estar vacía'),
  // TODO: 9. Validar status, start_date y budget como opcionales, con las mismas reglas que al crear.
  body('status')
    .optional()
    .isIn(STATUSES)
    .withMessage('El status no es válido'),
  body('start_date')
    .optional()
    .isDate()
    .withMessage('La start_date no es una fecha válida'),
  body('budget')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('El budget debe ser un número positivo'),
  // TODO: 10. Validar leader_id como opcional, existente y de un usuario activo.
  body('leader_id')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('El leader_id debe ser un id entero positivo')
    .bail()
    .custom(isActiveUser),
  // TODO: 11. Validar technologies como opcional, con ids que existan.
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Las technologies deben ser una lista')
    .bail()
    .custom(technologiesExist),
  // ? Para saber qué proyecto se edita, el id se obtiene de los parámetros de la ruta (req.params).
];
