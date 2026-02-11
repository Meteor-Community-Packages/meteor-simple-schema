export default async function validate(ss, doc, options) {
    const context = ss.newContext();
    await context.validate(doc, options);
    return context;
}
