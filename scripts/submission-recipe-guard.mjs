const registry = 'tt:submissions:v1';
export function recipeTarget(env) {
  const endpoint = new URL(env.SUBMISSION_REDIS_TEST_URL || '');
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/' || !endpoint.hostname.endsWith('.upstash.io') || !env.SUBMISSION_REDIS_TEST_TOKEN) throw new Error('Invalid recipe configuration');
  const production = env.SUBMISSION_REDIS_URL ? new URL(env.SUBMISSION_REDIS_URL).href : null;
  const preactivation = endpoint.href === production;
  if (preactivation && env.SUBMISSION_RECIPE_PREACTIVATION !== 'true') throw new Error('Production target refused');
  return { endpoint: endpoint.href, token: env.SUBMISSION_REDIS_TEST_TOKEN, preactivation };
}
export function assertEmptyRegistry(length) {
  if (length !== 0) throw new Error('Recipe requires an empty production registry');
}
export function isolateRecipeCommand(command, key) {
  if (!/^tt:recipe:[0-9a-f-]{36}$/i.test(key) || !Array.isArray(command)) throw new Error('Invalid recipe key');
  if (command[0] === 'EVAL') {
    if (command[2] !== 1 || command[3] !== registry) throw new Error('Recipe command refused');
    return [command[0], command[1], 1, key, ...command.slice(4)];
  }
  if (!['HGET', 'HSCAN'].includes(command[0]) || command[1] !== registry) throw new Error('Recipe command refused');
  return [command[0], key, ...command.slice(2)];
}
