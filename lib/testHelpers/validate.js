export default function validate(ss, doc, options) {
  const context = ss.newContext();
  context.validate(doc, options);
  return context;
}
