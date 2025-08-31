# pow-reaction

proof-of-work reactions for your blogs

see in action: [blog.hloth.dev](https://blog.hloth.dev)

## How POW captcha works

1. You generate a `challenge` which consists of a. `difficulty`, b. number of `rounds`
2. You generate a unique random string of characters for each round called `id`
3. User now has to find a hash so that `hash(id + nonce)` -> translated to binary (`000111010101011`) starts from `difficulty` number of consecutive zeroes by iterating `nonce` starting from 0 and until they find the hash
4. They send their `solutions` (nonces) back with the `challenge` signed by you (to retrieve parameters for captcha and keep this lib stateless)
5. All you have to do is verify their solutions by checking if `hash(id + nonce)` with their provided `nonce` -> translated to binary really starts from `difficulty` number of consecutive zeroes

Add progressively increasing difficulty with each subsequent request, and you get a pretty good stateless, privacy friendly rate limiter.

Not only this is a secure way of stopping flood but also a fair way for users to express their reaction. More reactions = more time to spend = those who appreciate the page's content more will send more reactions.

Couple of qurks:

- Instead of setting `difficulty` to 100 and `rounds` to 1, set `difficulty` to 1 and `rounds` to 100
  - more rounds = more equal average time of solving the challenge
  - more rounds = real progress bar for user
  - more rounds = run several workers to seek solution in parallel
- Instead of mining on single core, use WebWorkers
  - web workers run in a separate thread = no UI freezes
  - several web workers = several times faster to find all solutions
  - use `navigator.hardwareConcurrency` which is supported by every browser

## License

[MIT](./LICENSE)

## Donate

[hloth.dev/donate](https://hloth.dev/donate)