import {find, sortBy} from 'lodash';

import { Annotation, Entity, Input } from './types/input';
import { ConvertedAnnotation, ConvertedEntity, Output } from './types/output';

export const convertInput = (input: Input): Output => {

  const documents = input.documents.map((document) => {
    const convertedEntities = document.entities.map(entity => convertEntity(entity, document.entities));
    const entities = convertedEntities.sort(sortEntities);
    // console.log("entities:", entities);

    // TODO: map the annotations to the new structure and sort them based on the property "index"
    // Make sure the nested children are also mapped and sorted
    const annotations = document.annotations.map(annotation => convertAnnotation(annotation, entities, document.annotations)).sort(sortAnnotations);
    // console.log("annotations:", annotations);
    return { id: document.id, entities, annotations };
  });
console.log("documents: ", JSON.stringify(documents));
  return { documents };
};

const convertEntity = (entity: Entity, entities: Entity[]): ConvertedEntity => {
  const convertedEntity: ConvertedEntity = {
    id: entity.id,
    name: entity.name,
    type: entity.type,
    class: entity.class,
    children: []
  };

// Check for parent ref
if (entity.refs.length > 0) {
  // Find parent, push entity to children array
  const ref = entity?.refs[0]; // *Assuming max one parent per entity
  const parentEntity = entities.find(entity => entity.id === ref);
  if (parentEntity) {
    const convertedParentEntity = convertEntity(parentEntity, entities)
    convertedParentEntity.children.push(convertedEntity);
    convertedParentEntity.children.sort(sortEntities);
  }
}
  return convertedEntity;
};

const sortEntities = (entityA: ConvertedEntity, entityB: ConvertedEntity): number => {
  return sortBy([entityA, entityB], 'name')[0] === entityA ? 1 : -1;
};

const convertAnnotation = (annotation: Annotation, entities:ConvertedEntity[], annotations: Annotation[]): ConvertedAnnotation => {
  const entity = findEntityById(annotation.entityId, entities);
const convertedAnnotation: ConvertedAnnotation = {
  id: annotation.id,
  entity: entity? {id: entity.id, name: entity.name} : {id: "", name:""},
  value: annotation.value,
  index: annotation.indices?.[0]?.start ?? null,
  children: []
}

// check for parent ref
if(annotation.refs.length > 0){
  // get parent id
  const ref = annotation?.refs[0]; // *Assuming max one parent per annotation
  // get parent annotation
  const parentAnnotation = annotations.find(annotation => annotation.id === ref);
  // convert parent, push current child annotation into children array
  if(parentAnnotation){
    const convertedParentAnnotation = convertAnnotation(parentAnnotation, entities, annotations)
    convertedParentAnnotation.children.push(convertedAnnotation);
    convertedParentAnnotation.children.sort(sortAnnotations);
  }
}

return convertedAnnotation;
};


const findEntityById = (entityId: string, entities: ConvertedEntity[]): ConvertedEntity | undefined => {
  return find(entities, { id: entityId });
};

const sortAnnotations = (annotationA: ConvertedAnnotation, annotationB: ConvertedAnnotation) => {
return (annotationA.index || 0) - (annotationB.index || 0);
};

// BONUS: Create validation function that validates the result of "convertInput". Use yup as library to validate your result.
