# [1.6.0](https://github.com/dezkareid/osddt/compare/osddt-v1.5.0...osddt-v1.6.0) (2026-02-27)


### Features

* **templates:** improve next step instructions for osddt.start and osddt.research ([c8ebcdb](https://github.com/dezkareid/osddt/commit/c8ebcdb52ee86ab145f35ba667d4f4f774efd6be))

# [1.5.0](https://github.com/dezkareid/osddt/compare/osddt-v1.4.0...osddt-v1.5.0) (2026-02-25)


### Features

* **clarify:** remove answered questions from Open Questions section ([fb0c0c6](https://github.com/dezkareid/osddt/commit/fb0c0c6f89b5383dd18d26139e10fbec8c674761))

# [1.4.0](https://github.com/dezkareid/osddt/compare/osddt-v1.3.2...osddt-v1.4.0) (2026-02-24)


### Features

* **templates:** add osddt.clarify command ([d970813](https://github.com/dezkareid/osddt/commit/d9708137ecdb4bb1433442ca52be8dca0813cab5))

## [1.3.2](https://github.com/dezkareid/osddt/compare/osddt-v1.3.1...osddt-v1.3.2) (2026-02-24)


### Bug Fixes

* **spec:** remove technical details from spec command prompt ([eaf8a25](https://github.com/dezkareid/osddt/commit/eaf8a25225b17b3b82a3826f954f9ee54790bfb5))

## [1.3.1](https://github.com/dezkareid/osddt/compare/osddt-v1.3.0...osddt-v1.3.1) (2026-02-21)


### Bug Fixes

* **done:** remove .osddtrc dependency and pass --dir from template ([40cdb77](https://github.com/dezkareid/osddt/commit/40cdb7788b65a7604d7e459cceda586d0eeff642))

# [1.3.0](https://github.com/dezkareid/osddt/compare/osddt-v1.2.0...osddt-v1.3.0) (2026-02-20)


### Bug Fixes

* **implement:** skip prompt and proceed directly when tasks file exists ([c4a4e6d](https://github.com/dezkareid/osddt/commit/c4a4e6dc9d28efdb885ddfb414643d59e68d3d7e))
* **templates:** check output file existence before reading input files ([e3a0367](https://github.com/dezkareid/osddt/commit/e3a0367ca11be338b3f71dd196bc9bdc5d6e2c75))


### Features

* **setup:** add --agents and --repo-type flags for non-interactive mode ([2942f76](https://github.com/dezkareid/osddt/commit/2942f76c46061c53c1fd2da2b9ade898be1f5ffa))

# [1.2.0](https://github.com/dezkareid/osddt/compare/osddt-v1.1.0...osddt-v1.2.0) (2026-02-20)


### Features

* check for existing output file in plan, tasks, and implement steps ([b86db59](https://github.com/dezkareid/osddt/commit/b86db59508537b82584effd454c4010ffae18538))

# [1.1.0](https://github.com/dezkareid/osddt/compare/osddt-v1.0.0...osddt-v1.1.0) (2026-02-20)


### Features

* add agent selection to setup, fix package name in docs, and document project structure ([77e2b9f](https://github.com/dezkareid/osddt/commit/77e2b9f53f79cc7fb4d4b5a6efd55f1f0a2d8a68))

# 1.0.0 (2026-02-20)


### Bug Fixes

* change version release ([e12557e](https://github.com/dezkareid/osddt/commit/e12557e9999e84c354390883a4a8d2df5ced099c))
* ci setup action ([998eba3](https://github.com/dezkareid/osddt/commit/998eba3f53f2c32b49a8f235250e41a1f092b265))


### Features

* add configuration to store kind of repository ([ca73490](https://github.com/dezkareid/osddt/commit/ca7349066855d5b0390ef7418180fbef19a959f2))
* add feature name length and format constraints ([80796d3](https://github.com/dezkareid/osddt/commit/80796d364b8068db82bfece58054cba320037368))
* add meta-info and done commands, working-on folder structure, and BDD test suite ([178161c](https://github.com/dezkareid/osddt/commit/178161c5ebd5b77ee5f7cfed7d69917f6fab28a0))
* add next step prompt at the end of each command template ([2b272a2](https://github.com/dezkareid/osddt/commit/2b272a204859fb440e579d04aa900c3878c9b060))
* add osddt.continue and restrict REPO_PREAMBLE to entry-point commands ([cc3864a](https://github.com/dezkareid/osddt/commit/cc3864a5f9cbe398ad2f527f8e7308296b16882c))
* add osddt.research template and make osddt.spec research-aware ([9b394a3](https://github.com/dezkareid/osddt/commit/9b394a3ecdb55091e44e763381b4d38b799d4f4f))
* add osddt.start command template and document all templates ([255e5ac](https://github.com/dezkareid/osddt/commit/255e5acd4dd3c73682f4b106f466e8d4aabf8d38))
* add package metadata and publishing configuration to package.json ([a6b71c2](https://github.com/dezkareid/osddt/commit/a6b71c27f68cdb592ddba4b8e5e7f80266b8119e))
* handle existing working directory and branch in start and research ([37e7cb8](https://github.com/dezkareid/osddt/commit/37e7cb81ff716c174424307b5069cdaa5dae74d5))
* prefix done folder with YYYY-MM-DD date on move ([06046c6](https://github.com/dezkareid/osddt/commit/06046c692b0f30097ad92b94a48b2edb56b1e8fb))
* read configuration ([080e81b](https://github.com/dezkareid/osddt/commit/080e81b4e81e5152499c96312b18217be46cb915))
* setup command ([2b7459f](https://github.com/dezkareid/osddt/commit/2b7459ff3f8ebff6c14f3df570e17f98f595cfd0))
