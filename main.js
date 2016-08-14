import SimpleSchema, { ValidationContext } from 'simpl-schema';
import { ValidationError } from 'meteor/mdg:validation-error';

// Convert the vanilla Error into a Meteor.Error until DDP is able to pass
// vanilla errors back to the client.
SimpleSchema.defineValidationErrorTransform(error => {
  // Move any properties other than `name` and `type` to `details` object.
  const errors = error.details.map(errorObj => {
    const details = Object.assign({}, errorObj);
    delete details.name;
    delete details.type;

    return {
      name: errorObj.name,
      type: errorObj.type,
      details,
    };
  });

  return new ValidationError(errors, error.message);
});

export { SimpleSchema, ValidationContext };
