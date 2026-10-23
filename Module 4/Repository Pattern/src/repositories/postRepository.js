const initialPosts = [
  { id: 1, title: 'First post', body: 'Repository boundaries protect change.', authorId: 7 },
  { id: 2, title: 'Second post', body: 'Services should speak in domain language.', authorId: 8 },
];

// This repository currently uses a Map. Replacing it with Prisma changes only
// this module's storage implementation and persistence setup; the five-method
// contract, service business rules, controllers, routes, and API responses stay
// the same.
const posts = new Map(initialPosts.map((post) => [post.id, post]));
let nextId = 3;

function findAll() {
  return Array.from(posts.values());
}

function findById(id) {
  return posts.get(Number(id)) || null;
}

function create(fields) {
  const post = {
    id: nextId++,
    ...fields,
  };
  posts.set(post.id, post);
  return post;
}

function update(id, patch) {
  const post = findById(id);
  if (!post) return null;

  Object.assign(post, patch);
  return post;
}

function remove(id) {
  return posts.delete(Number(id));
}

module.exports = { findAll, findById, create, update, remove };
