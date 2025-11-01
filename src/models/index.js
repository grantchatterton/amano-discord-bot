import { Sequelize } from "sequelize";
import { z } from "zod";

export const ModelLoaderSchema = z.function().args(z.instanceof(Sequelize)).returns(z.any());

/**
 * @typedef {z.infer<typeof ModelLoaderSchema>} ModelLoader
 */

/**
 * Defines the predicate to check if an object is a valid ModelLoader type.
 *
 * @type {import('../util/loaders.js').StructurePredicate<ModelLoader>}
 * @returns {structure is ModelLoader}
 */
export const predicate = (structure) => ModelLoaderSchema.safeParse(structure).success;
