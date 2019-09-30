# Runnable super-rentals tutorial

[![Build Status](https://travis-ci.org/ember-learn/super-rentals-tutorial.svg?branch=master)](https://travis-ci.org/ember-learn/super-rentals-tutorial)

## What?

This allows you to create a runnable tutorial by embedding special runnable
instructions (directives) in the markdown source, using the triple-backtick
markdown code block syntax. These code blocks will be executed at build time
and replaced with their output in the final markdown files.

## Why?

* Make sure the tutorial steps are up-to-date and working correctly with the
  latest Ember, Ember CLI Ember Data, etc.
* Save time by not having to manually sync the content with upstream blueprint
  changes!
* Easy to maintain – changing a step early on in the tutorial automatically
  propagates to later steps (in code snippets, etc).
* A fantastic integration test suite for the Ember ecosystem!

## What?

### `run:command`

Run one or more commands.

Example:

    ```run:command
    ember new super-rentals -b @ember/octane-app-blueprint
    ```

Result:

    ```
    > ember new super-rentals -b @ember/octane-app-blueprint
    installing octane-app-blueprint
      create .editorconfig
      create .ember-cli.js
      create .eslintignore
      create .eslintrc.js
      create .template-lintrc.js
      create .travis.yml
      create .watchmanconfig
      create README.md
      create app/app.js
      create app/index.html
      create app/resolver.js
      create app/router.js
      create app/styles/app.css
      create app/templates/application.hbs
      create config/environment.js
      create config/optional-features.json
      create config/targets.js
      create ember-cli-build.js
      create .gitignore
      create jsconfig.json
      create package.json
      create public/robots.txt
      create testem.js
      create tests/index.html
      create tests/test-helper.js
    npm: Installed dependencies
    Successfully initialized git.
    ```

The content of the source code block is the command(s) to run.

Commands can span multiple lines using `\` at the end of each line to signal
line-continuation, as in:

    ```run:command
    echo "This is a \
      command that \
      spans multiple \
      lines."
    ```

Mutliple commands can be supplied. If any of them fails, it will fail the
build.

    ```run:command
    npm run lint:hbs
    npm run lint:js
    npm run test
    ```

Lines starting with `#` and empty lines are ignored.

Options:

* `lang`

  The syntax highlight language to use in the resulting code block. Defaults
  to `shell`.

* `hidden=true`

  Run the command(s), but omit the code block from the final markdown file
  entirely.

* `cwd`

  Specify a CWD (relative to `dist/code`) for the command. This defaults to
  `.` (i.e. `dist/code`), but most of the time you probably want to set it to
  `super-rentals` (i.e. `dist/code/super-rentals`). Unfortunately, we cannot
  just make that the default, because at the beginning of the tutorial, the
  folder does not exists yet. (Generating the app is part of the tutorial.)

* `captureCommand=false`

  Run the command(s), but omit the command(s) themselves from the the resulting
  code block.

* `captureOutput=false`

  Run the command(s), but omit their output from the resulting code block.

### `run:file:create`

Create a file.

Example:

    ```run:file:create lang=handlebars cwd=super-rentals filename=app/templates/index.hbs
    <div class="jumbo">
      <div class="right tomster"></div>
      <h2>Welcome to Super Rentals!</h2>
      <p>We hope you find exactly what you're looking for in a place to stay.</p>
    </div>
    ```

Result:

    ```handlebars { data-filename="app/templates/index.hbs" }
    <div class="jumbo">
      <div class="right tomster"></div>
      <h2>Welcome to Super Rentals!</h2>
      <p>We hope you find exactly what you're looking for in a place to stay.</p>
    </div>
    ```

The content of the source code block is used to populate the newly created
file. It is also rendered into the resulting code block. A trailing newline
will be added automatically, if it's not already included in the source code
block.

Options:

* `lang`

  The syntax highlight language to use in the resulting code block.

* `hidden=true`

  Create the file, but omit the code block from the final markdown file
  entirely.

* `cwd`

  Specify a CWD (relative to `dist/code`) for the filename. This defaults to
  `.` (i.e. `dist/code`), but most of the time you probably want to set it to
  `super-rentals` (i.e. `dist/code/super-rentals`). Otherwise, the resulting
  code block will have its `data-filename` set to `super-rentals/app/...`,
  which is probably not what you want. Unfortunately, we cannot just make that
  the default, because at the beginning of the tutorial, the folder does not
  exists yet. (Generating the app is part of the tutorial.)

* `filename` (**required**)

  The filename (the path relative to `cwd`) used for creating the file. Also
  sets the `data-filename` metadata field in the resulting code block.

### `run:file:copy`

Copy a file or folder from the `assets` folder.

Example:

    ```run:file:copy lang=css src=downloads/style.css cwd=super-rentals filename=app/styles/app.css
    @import url(https://fonts.googleapis.com/css?family=Lato:300,300italic,400,700,700italic);

    /**
     * Base Elements
     */

    * {
      margin: 0;
      padding: 0;
    }

    /** ...snip... */
    ```

Result:

    ```css { data-filename="app/styles/app.css" }
    @import url(https://fonts.googleapis.com/css?family=Lato:300,300italic,400,700,700italic);

    /**
     * Base Elements
     */

    * {
      margin: 0;
      padding: 0;
    }

    /** ...snip... */
    ```

If the source is a file, then the source file's content will be rendered into
the resulting code block. ~~If the source is a folder, its structure will be
rendered into the resulting code block using a format similar to the Unix
`tree` command.~~

If the source code block is non-empty, its content will be rendered into the
resulting code block in place of the default output described above. This is
useful because the file you are copying is probably quite large, and you don't
necessarily want to render the whole file into the resulting markdown file.

Options:

* `lang`

  The syntax highlight language to use in the resulting code block.

* `hidden=true`

  Copy the file, but omit the code block from the final markdown file entirely.

* `cwd`

  Specify a CWD (relative to `dist/code`) for the filename. This defaults to
  `.` (i.e. `dist/code`), but most of the time you probably want to set it to
  `super-rentals` (i.e. `dist/code/super-rentals`). Otherwise, the resulting
  code block will have its `data-filename` set to `super-rentals/app/...`,
  which is probably not what you want. Unfortunately, we cannot just make that
  the default, because at the beginning of the tutorial, the folder does not
  exists yet. (Generating the app is part of the tutorial.)

* `src` (**required**)

  The source filename (the path relative to `dist/assets`) used for creating
  the file. Also sets the `data-filename` metadata field in the resulting code
  block.


* `filename` (**required**)

  The filename (the path relative to `cwd`) used for creating the file. Also
  sets the `data-filename` metadata field in the resulting code block.

### `run:file:patch`

Edit a file by applying a git patch.

Example:

    ```run:file:patch lang=js cwd=super-rentals filename=app/router.js
    @@ -9,2 +9,3 @@
     Router.map(function() {
    +  this.route('about');
     });
    ```

Result:

    ```js { data-filename="app/router.js" data-diff="+9" }
    import EmberRouter from '@ember/routing/router';
    import config from './config/environment';

    const Router = EmberRouter.extend({
      location: config.locationType,
      rootURL: config.rootURL
    });

    Router.map(function() {
      this.router('about');
    });

    export default Router;
    ```

The content of the source code block is the git patch to apply.

A patch can be generated by modifying a file, and running `git diff -U`.

It is often a good idea to ask git to include minimal context to make the patch
more resilient to changes in the blueprints. You can control the number of
context lines included in the diff by passing a number to `-U`, such as
`git diff -U1`. You can also manually edit and tweak the resulting patch to
keep a useful amount of context for the task at hand.

It appears that the `diff ...` header line as well as the `index ...` line, as
well as the "hunk context" (the text after the `@@ ... @@`) can be safely
omitted. The `--- filename` and `+++ filename` lines are required by git, but
can be omitted in the block; the directive will prepend them for you based on
the `filename` argument if they are not already included in the patch.

A good workflow for generating patches:

* Insert `run:pause` at the appropriate spot
* Make sure the file you are editing is clean or staged (`git add file`)
* Make the changes
* `git diff -U1 > diff.patch`, play with the context number, tweak the patch by
  hand until you are happy with how it looks (keeping source-readibility in
  mind)
* Undo the changes with `git checkout file`
* Test the patch with `git apply diff.patch`

Even though the patch contains line numbers, those are only used as "hints"
when applying the diff. In practice, a well crafted patch could be quite
resilient. For instance, the patch given in the example has been verified to
apply cleanly even if the router blueprint has been changed to this:

```js
import EmberRouter from '@ember/routing/router';
import config from './config/environment';

export default class Router extends EmberRouter {
 location = config.locationType;
 rootURL = config.rootURL;
}

Router.map(function() {
});
```

As you can see, even though the line numbers have shifted around, git has no
trouble finding the relevant router map section from the above.

If the patch fails to apply cleanly, it will fail the build.

The resulting code block will contain the "combined" source of the file being
edited, with `data-diff` metadata field indicated the removed and added lines.
We can use this data on the client side to format the diff output. Potentially
we can render it using an interactive component that allows you to toggle
between the before/after/combined source, as well as folding away the unchanged
lines.

Options:

* `lang`

  The syntax highlight language to use in the resulting code block.

* `hidden=true`

  Edit the file, but omit the code block from the final markdown file entirely.

* `cwd`

  Specify a CWD (relative to `dist/code`) for the filename. This defaults to
  `.` (i.e. `dist/code`), but most of the time you probably want to set it to
  `super-rentals` (i.e. `dist/code/super-rentals`). Otherwise, the resulting
  code block will have its `data-filename` set to `super-rentals/app/...`,
  which is probably not what you want. Unfortunately, we cannot just make that
  the default, because at the beginning of the tutorial, the folder does not
  exists yet. (Generating the app is part of the tutorial.)

* `filename`

  The filename (the path relative to `cwd`) used for creating the file. Also
  sets the `data-filename` metadata field in the resulting code block.

  This is also used to format the patch before sending it to `git apply`, so
  it is required unless they are already included in the patch and the block is
  set to `hidden`.

### `run:file:show`

Render the content of a file ~~or a folder~~.

Example:

    ```run:file:show lang=handlebars cwd=super-rentals filename=app/templates/index.hbs
    ```

Result:

    ```handlebars { data-filename="app/templates/index.hbs" }
    <div class="jumbo">
      <div class="right tomster"></div>
      <h2>Welcome to Super Rentals!</h2>
      <p>We hope you find exactly what you're looking for in a place to stay.</p>
    </div>
    ```

The content of the source code block is not used. ~~If the source is a folder,
its structure will be rendered into the resulting code block using a format
similar to the Unix `tree` command.~~

Options:

* `lang`

  The syntax highlight language to use in the resulting code block.

* `cwd`

  Specify a CWD (relative to `dist/code`) for the filename. This defaults to
  `.` (i.e. `dist/code`), but most of the time you probably want to set it to
  `super-rentals` (i.e. `dist/code/super-rentals`). Otherwise, the resulting
  code block will have its `data-filename` set to `super-rentals/app/...`,
  which is probably not what you want. Unfortunately, we cannot just make that
  the default, because at the beginning of the tutorial, the folder does not
  exists yet. (Generating the app is part of the tutorial.)

* `filename` (**required**)

  The filename (the path relative to `cwd`) used for reading the file. Also
  sets the `data-filename` metadata field in the resulting code block.

### `run:checkpoint`

Indicates a checkpoint where the following steps are performed:

* `yarn lint:hbs`
* `yarn lint:js`
* `yarn test`
* Optionally, commit the current changes
* Verify the git tree is clean (i.e. no dirty or untracked files)

This directive does not produce any output. If any of the steps failed, it will
fail the build.

Example:

    ```run:checkpoint cwd=super-rentals
    Chapter 1
    ```

The content of the source code block is the git commit message.

To avoid failing the "clean tree" test, you should be adding any created or
modified files to the staging area as you go, using `run:command hidden=true`
code blocks.

* `cwd`

  Specify a CWD (relative to `dist/code`) for the command. This defaults to
  `.` (i.e. `dist/code`), but most of the time you probably want to set it to
  `super-rentals` (i.e. `dist/code/super-rentals`). Unfortunately, we cannot
  just make that the default, because at the beginning of the tutorial, the
  folder does not exists yet. (Generating the app is part of the tutorial.)

* `commit=false`

  Don't create a git commit, but still run the other checks, *including the
  "clean tree" test*. This is only useful if the chapter did not make any
  changes at all, or one of the visible `run:command` blocks already committed
  the changes as part of the tutorial flow.

### `run:ignore` (or `run:ignore:*`)

Ignore the source code block, and omit it from the final markdown file
entirely.

This is useful for temporarily disabling a directive code block for debugging,
or because it is not working, while still keeping the code in the source file.
Essentially, this is how you "comment out" a directive code block.

For your convenience, you can pass any sub-directive after `run:ignore:`, or
pass any arguments to it. This allows you to just insert `:ignore:` into an
existing directive code block to disable it, without making any other changes.

Example:

    ```run:ignore:command cwd=super-rentals
    # FIXME: don't run this for now, since Heroku is down atm
    git push heroku master
    ```

### `run:pause`

Pause the build until you are ready to resume.

This allows you to examine the state of things at a specific point in the
tutorial, which is useful for debugging, taking screenshots or generating
diff patches. Essentially, this is the `this.pauseTest()` for the tutorial.

Example:

    ```run:pause
    Manually record a gif of performing the following steps:

    ...snip...
    ```

The content of the source code block will be printed to the command line
prompt. This directive does not produce any output.

### `run:server:start`

Start a server (background task).

Example:

    ```run:server:start cwd=super-rentals expect="Serving on http://localhost:4200/"
    ember server
    ```

Result:

    ```shell
    $ ember server
    Build successful (9006ms) – Serving on http://localhost:4200/
    ```

The content of the source code block is the command for starting the server.
Unlike `run:command`, you can only pass a single command, thought the command
may span multiple lines if needed, using `\` at the end of each line to signal
line-continuation.

Lines starting with `#` and empty lines are ignored.

All servers started with this directive must be explicitly shut down with the
`run:server:stop` directive before the end of the file, otherwise the build
will fail.

Options:

* `id`

  A unique identifier to reference this server process, which is needed when
  shutting it down later. This is optional; by default, the command to start
  the server is used as the id, but this allows you to specify a shorter name
  if desired.

* `lang`

  The syntax highlight language to use in the resulting code block. Defaults
  to `shell`.

* `hidden=true`

  Start the server, but omit the code block from the final markdown file
  entirely.

* `cwd`

  Specify a CWD (relative to `dist/code`) for the command. This defaults to
  `.` (i.e. `dist/code`), but most of the time you probably want to set it to
  `super-rentals` (i.e. `dist/code/super-rentals`). Unfortunately, we cannot
  just make that the default, because at the beginning of the tutorial, the
  folder does not exists yet. (Generating the app is part of the tutorial.)

* `expect`

  Wait for a particular string to appear on STDOUT to ensure the server has
  started successfully, before moving on to the next step.

* `timeout`

  Wait for some time to pass (specified in seconds) before moving on to the
  next step.

  If used in conjunction with the `expect` option, it will fail the step if the
  checks are not completed before the deadline.

* `captureCommand=false`

  Omit the command used to start the server from the the resulting code block.

* `captureOutput=false`

  Omit the output of the command used to start the server from the resulting
  code block.

### `run:server:stop`

Stop a server (background task) previously started with `run:server:start`.

Example:

    ```run:server:stop
    ember server
    ```

The content of the source code block is the command used to start the server.
This directive does not produce any output.

Options:

* `id`

  A unique identifier to reference the server process (see `run:server:start`).
  If this option is passed, the content block is ignored.

## How?

* Requires [volta](https://volta.sh), `git`
* Probably only works on unix/bash for now (PRs welcome)
  * Should probably run the build in a docker container anyway
* `yarn install`
* `yarn build`
* Processed markdown can be found in `dist/chapters`
* The `super-rentals` code can be found in `dist/code/super-rentals`

## Future Work

* `run:screenshot`
* `run:gif`
* Setup CI to run the build
  * Push or PR to `ember-learn/super-rentals` and `ember-learn/guide-source`
* Improve the build output
* Extract this from `super-rentals` and make it usable for building arbitrary
  runnable tutorials

## Prior Art

* [RunDOC](https://github.com/schneems/rundoc)
