<!--lint disable no-undefined-references-->

In this chapter, you will install *[Ember CLI][TODO: link to Ember CLI]*, use it to generate a new Ember project, and add some basic templates and styles to your new app. By the end of this chapter, you should have a landing page with Professor Tomster's cute little face featured on it:

![The Super Rentals app by the end of the chapter](/screenshots/01-orientation/styled-with-tomster@2x.png)

While building your landing page, you will learn about:

* Installing Ember CLI
* Creating a new Ember app with Ember CLI
* Starting and stopping the development server
* Editing files and live reload
* Working with HTML, CSS and assets in an Ember app

## Installing Ember CLI

You can install the latest version of Ember CLI by running the following command. If you've already done this by following the [Quick Start](../../getting-started/quick-start/) guide, feel free to skip ahead!

```shell
$ npm install -g ember-cli
```

To verify that your installation was successful, run:

```run:command
ember --version
```

If a version number is shown, you're ready to go.

## Creating a New Ember App with Ember CLI

We can create a new project using Ember CLI's `new` command. It follows the pattern `ember new <project-name>`. In our case, the project name would be `super-rentals`:

```run:command hidden=true
# Hack: convince ember-cli we are really not in a project. Otherwise, we will get the "You cannot use the new command inside an ember-cli project." error when running `ember new`.
echo "{}" > package.json
```

```run:command
# We are supposed to (?) use NPM for the guides, but yarn works better
# for our setup, so we pass the `--yarn` flag but change the output to
# pretend we are running NPM.

#[cfg(all(ci, unix))]
#[display(ember new super-rentals -b @ember/octane-app-blueprint)]
ember new super-rentals --yarn -b @ember/octane-app-blueprint \
  | awk '{ gsub("Yarn", "npm"); gsub("yarn", "npm"); print }'

#[cfg(not(all(ci, unix)))]
ember new super-rentals --yarn -b @ember/octane-app-blueprint
```

```run:command hidden=true
# Clean up the hack above

#[cfg(unix)]
rm package.json

#[cfg(windows)]
del package.json
```

```run:file:patch hidden=true cwd=super-rentals filename=testem.js
@@ -9,2 +9,3 @@
   ],
+  browser_start_timeout: process.env.CI ? 60 : null,
   browser_args: {
```

```run:file:patch hidden=true cwd=super-rentals filename=tests/index.html
@@ -28,2 +28,91 @@
     <script src="{{rootURL}}assets/tests.js"></script>
+    <script>
+      if (QUnit.urlParams.deterministic) {
+        // Not Very Good Pseudo Random-ish Number Generator
+        // Based on https://stackoverflow.com/a/19303725
+        class SeededRandomish {
+          constructor(seed) {
+            this.seed = seed;
+          }
+
+          next() {
+            let x = Math.sin(this.seed++) * 10000;
+            return x - Math.floor(x);
+          }
+        }
+
+        class RandomishMonotonicClock {
+          constructor(seed) {
+            this.prng = new SeededRandomish(seed);
+            this.ms = 1;
+          }
+
+          tick() {
+            // Heavily biased towards 0
+            let biased = this.prng.next() * this.prng.next() * this.prng.next();
+
+            // Tick up to 25ms but likely much smaller
+            this.ms += biased * 25;
+
+            return this.current;
+          }
+
+          get current() {
+            return Math.floor(this.ms);
+          }
+        }
+
+        let seeds = new SeededRandomish(41937);
+        let totalRuntime = 0;
+        let clock;
+
+        // HAX: ensure our callbacks runs before the reporter UI
+
+        QUnit.config.callbacks.testStart.unshift(details => {
+          let seed = Math.floor(seeds.next() * 100000);
+          clock = new RandomishMonotonicClock(seed);
+          for(let i=0; i<20; i++) {
+            clock.tick();
+          }
+        });
+
+        QUnit.config.callbacks.log.unshift(details => {
+          details.runtime = clock.tick();
+
+          if (details.source) {
+            Object.defineProperty(details, 'source', {
+              value: details.source.replace(/\.js((:[0-9]+)?:[0-9]+)/g, '.js')
+            });
+          }
+        });
+
+        QUnit.config.callbacks.testDone.unshift(details => {
+          let current;
+
+          for(let i=0; i<10; i++) {
+            current = clock.tick();
+          }
+
+          clock = undefined;
+          totalRuntime += current;
+          details.runtime = current;
+
+          if (details.source) {
+            Object.defineProperty(details, 'source', {
+              value: details.source.replace(/\.js((:[0-9]+)?:[0-9]+)/g, '.js')
+            });
+          }
+        });
+
+        QUnit.config.callbacks.done.unshift(details => {
+          details.runtime = totalRuntime;
+        });
+
+        QUnit.begin(function( details ) {
+          let ua = document.getElementById('qunit-userAgent');
+          ua.innerText = ua.innerText.replace(/QUnit [0-9\.]+/g, 'QUnit');
+          ua.innerText = ua.innerText.replace(/(WebKit|Chrome|Safari)\/[0-9\.]+/g, '$1');
+        });
+      }
+    </script>

```

```run:command hidden=true cwd=super-rentals
yarn test
git add testem.js
git add tests/index.html
git commit --amend --no-edit
```

This should have created a new folder for us called `super-rentals`. We can navigate into it using the `cd` command.

```shell
$ cd super-rentals
```

For the rest of the tutorial, all commands should be run within the `super-rentals` folder. This folder has the following structure:

```run:command lang=plain captureCommand=false
# Tree uses UTF-8 "non-breaking space" which gets turned into &nbsp;
# Somewhere in the guides repo's markdown pipeline there is a bug
# that further turns them into &amp;nbsp;

# Also, try to hide yarn.lock from view and fake a package-lock.json

#[cfg(unix)]
tree super-rentals -a -I "node_modules|.git|yarn.lock" --dirsfirst \
  | sed 's/\xC2\xA0/ /g' \
  | awk \
    '/package\.json/ { print $1 " package.json"; print $1 " package-lock.json" } \
    !/package\.json/ { print }'

#[cfg(windows)]
tree super-rentals /F
```

We'll learn about the purposes of these files and folders as we go. For now, just know that we'll spend most of our time working within the `app` folder.

## Starting and Stopping the Development Server

Ember CLI comes with a lot of different commands for a variety of development tasks, such as the `ember new` command that we saw earlier. It also comes with a *development server*, which we can launch with the `ember server` command:

```run:server:start cwd=super-rentals expect="Serving on http://localhost:4200/"
#[cfg(all(ci, unix))]
#[display(ember server)]
ember server | awk '{ \
  gsub("Build successful \\([0-9]+ms\\)", "Build successful (9761ms)"); \
  print; \
  system("") # https://unix.stackexchange.com/a/83853 \
}'

#[cfg(not(all(ci, unix)))]
ember server
```

The development server is responsible for compiling our app and serving it to the browsers. It may take a while to boot up. Once it's up and running, open your favorite browser and head to <http://localhost:4200>. You should see the following welcome page:

```run:screenshot width=1024 retina=true filename=welcome.png alt="Welcome to Ember!"
visit http://localhost:4200/
```

> Zoey says...
>
> The `localhost` address in the URL means that you can only access the development server from your local machine. If you would like to share your work with the world, you will have to *[deploy][TODO: link to deploy]* your app to the public Internet. We'll cover how to do that in Part 2 of the tutorial.

You can exit out of the development server at any time by typing `Ctrl + C` into the terminal window where `ember server` is running. That is, typing the "C" key on your keyboard *while* holding down the "Ctrl" key at the same time. Once it has stopped, you can start it back up again with the same `ember server` command. We recommend having two terminal windows open: one to run the server in background, another to type other Ember CLI commands.

## Editing Files and Live Reload

The development server has a feature called *live reload*, which monitors your app for file changes, automatically re-compiles everything, and refreshes any open browser pages. This comes in really handy during development, so let's give that a try!

As text on the welcome page pointed out, the source code for the page is located in `app/templates/application.hbs`. Let's try to edit that file and replace it with our own content:

```run:file:patch lang=handlebars cwd=super-rentals filename=app/templates/application.hbs
@@ -1,6 +1 @@
-{{!-- The following component displays Ember's default welcome message. --}}
-<WelcomePage />
-{{!-- Feel free to remove this! --}}
-
-{{outlet}}
-
+Hello World!!!
```

Soon after saving the file, your browser should automatically refresh and render our greetings to the world. Neat!

```run:screenshot width=1024 height=250 retina=true filename=hello-world.png alt="Hello World!!!"
visit http://localhost:4200/
```

When you are done experimenting, go ahead and delete the `app/templates/application.hbs` file. We won't be needing this for a while, so let's start afresh. We can add it back later when we have a need for it.

```run:command hidden=true cwd=super-rentals
git rm -f app/templates/application.hbs
```

Again, if you still have your browser tab open, your tab will automatically re-render a blank page as soon as you delete the file. This reflects the fact that we no longer have an application template in our app.

## Working with HTML, CSS and Assets in an Ember App

Create a `app/templates/index.hbs` file and paste the following markup.

```run:file:create lang=handlebars cwd=super-rentals filename=app/templates/index.hbs
<div class="jumbo">
  <div class="right tomster"></div>
  <h2>Welcome to Super Rentals!</h2>
  <p>We hope you find exactly what you're looking for in a place to stay.</p>
</div>
```

If you are thinking, "Hey, that looks like HTML!", then you would be right! In their simplest form, Ember templates are really just HTML. If you are already familiar with HTML, you should feel right at home here.

Of course, unlike HTML, Ember templates can do a lot more than just displaying static content. We will see that in action soon.

After saving the file, your browser tab should automatically refresh, showing us the welcome message we just worked on.

```run:screenshot width=1024 height=250 retina=true filename=unstyled.png alt="Welcome to Super Rentals! (unstyled)"
visit http://localhost:4200/
```

```run:command hidden=true cwd=super-rentals
git add app/templates/index.hbs
```

Before we do anything else, let's add some styling to our app. We spend enough time staring at the computer screen as it is, so we must protect our eyesight against unstyled markup!

Fortunately, our designer sent us some CSS to use, so we can <a href="/downloads/style.css" download="app.css">download the stylesheet file</a> and copy it into `app/styles/app.css`. This file has all the styles we need for building the rest of the app.

```run:file:copy lang=css src=downloads/style.css cwd=super-rentals filename=app/styles/app.css
@import url(https://fonts.googleapis.com/css?family=Lato:300,300italic,400,700,700italic);

/**
 * Base Elements
 */

* {
  margin: 0;
  padding: 0;
}

body,
h1,
h2,
h3,
h4,
h5,
h6,
p,
div,
span,
a,
button {
  font-family: 'Lato', 'Open Sans', 'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif;
  line-height: 1.5;
}

body {
  background: #f3f3f3;
}

/* ...snip... */
```

If you are familiar with CSS, feel free to customize these styles to your liking! Just keep in mind that you may see some visual differences going forward, should you choose to do so.

When you are ready, save the CSS file; our trusty development server should pick it up and refresh our page right away. No more unstyled content!

```run:screenshot width=1024 retina=true filename=styled.png alt="Welcome to Super Rentals! (styled)"
visit http://localhost:4200/
```

```run:command hidden=true cwd=super-rentals
git add app/styles/app.css
```

To match the mockup from our designer, we will also need to download the `teaching-tomster.png` image, which was referenced from our CSS file:

```css { data-filename=app/styles/app.css }
.tomster {
  background: url(../assets/images/teaching-tomster.png);
  /* ...snip... */
}
```

As we learned earlier, the Ember convention is to place your source code in the `app` folder. For other assets like images and fonts, the convention is to put them in the `public` folder. We will follow this convention by <a href="/downloads/teaching-tomster.png" download="teaching-tomster.png">downloading the image file</a> and saving it into `public/assets/images/teaching-tomster.png`.

```run:file:copy hidden=true src=downloads/teaching-tomster.png cwd=super-rentals filename=public/assets/images/teaching-tomster.png
```

Both Ember CLI and the development server understand these folder conventions and will automatically make these files available to the browser.

You can confirm this by navigating to
`http://localhost:4200/assets/images/teaching-tomster.png`. The image should also show up in the welcome page we have been working on. You may need to do a manual refresh for the browser to pick up the new file.

```run:command hidden=true cwd=super-rentals
git add public/assets/images/teaching-tomster.png
```

```run:screenshot width=1024 retina=true filename=styled-with-tomster.png alt="Welcome to Super Rentals! (with Tomster)"
visit http://localhost:4200/
```

```run:server:stop
ember server
```

```run:checkpoint cwd=super-rentals
Chapter 1
```
