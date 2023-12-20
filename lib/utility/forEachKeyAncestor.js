/**
 * Run loopFunc for each ancestor key in a dot-delimited key. For example,
 * if key is "a.b.c", loopFunc will be called first with ('a.b', 'c') and then with ('a', 'b.c')
 */
export default function forEachKeyAncestor(key, loopFunc) {
  let lastDot;

  // Iterate the dot-syntax hierarchy
  let ancestor = key;
  do {
    lastDot = ancestor.lastIndexOf('.');
    if (lastDot !== -1) {
      ancestor = ancestor.slice(0, lastDot);
      const remainder = key.slice(ancestor.length + 1);
      loopFunc(ancestor, remainder); // Remove last path component
    }
  } while (lastDot !== -1);
}
