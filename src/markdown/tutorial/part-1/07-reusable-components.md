<!--lint disable no-undefined-references-->

The last missing feature for the `<Rental>` component is a map to show the location of the rental, which is what we're going to work on next:

![The Super Rentals app by the end of the chapter](/images/tutorial/part-1/reusable-components/three-old-mansions@2x.png)

While adding the map, you will learn about:

* Managing application-level configurations
* Parameterizing components with arguments
* Accessing component arguments
* Interpolating values in templates
* Overriding HTML attributes in `...attributes`
* Refactoring with getters and auto-track
* Getting JavaScript values into the test context

## Managing Application-level Configurations

We will use the [TomTom](https://developer.tomtom.com/map-display-api/documentation/product-information/introduction) API to generate maps for our rental properties. You can [sign up](https://developer.tomtom.com) for free and without a credit card.

TomTom provides a [static map images API](https://developer.tomtom.com/map-display-api/documentation/raster/static-image), which serves map images in PNG format. This means that we can generate the appropriate URL for the parameters we want and render the map using a standard `<img>` tag. Pretty neat!

Once you have signed up, grab your *[default public token](https://developer.tomtom.com/user/me/apps)* and paste it into `config/environment.js`:

```run:file:patch lang=js cwd=super-rentals filename=config/environment.js
@@ -50,2 +50,4 @@

+  ENV.TOMTOM_ACCESS_TOKEN = 'paste your TomTom API key here';
+
   return ENV;
```

As its name implies, `config/environment.js` is used to *configure* our app and store API keys like these. These values can be accessed from other parts of our app, and they can have different values depending on the current environment (which might be development, test, or production).

```run:command hidden=true cwd=super-rentals
pnpm test
git add config/environment.js
```

```run:file:patch hidden=true cwd=super-rentals filename=config/environment.js
@@ -50,3 +50,3 @@

-  ENV.TOMTOM_ACCESS_TOKEN = 'paste your TomTom API key here';
+  ENV.TOMTOM_ACCESS_TOKEN = process.env.TOMTOM_ACCESS_TOKEN;

```

```run:command hidden=true cwd=super-rentals
pnpm test
git add config/environment.js
```

After saving the changes to our configuration file, we will need to restart our development server to pick up these file changes. Unlike the files we have edited so far, `config/environment.js` is not automatically reloaded.

<!-- TODO: https://github.com/ember-cli/ember-cli/issues/8782 -->

You can stop the server by finding the terminal window where `npm start` is running, then type `Ctrl + C`. That is, typing the "C" key on your keyboard *while* holding down the "Ctrl" key at the same time. Once it has stopped, you can start it back up again with the same `npm start` command.

```run:server:start cwd=super-rentals expect="Local:   http://localhost:4200/"
#[cfg(all(ci, unix))]
#[display(npm start)]
npm start | awk '{ \
  gsub("Build successful \\([0-9]+ms\\)", "Build successful (13286ms)"); \
  print; \
  system("") # https://unix.stackexchange.com/a/83853 \
}'

#[cfg(not(all(ci, unix)))]
npm start
```

## Generating a Component with a Component Class

With the TomTom API key in place, let's generate a new component for our map.

```run:command cwd=super-rentals
ember generate component map --component-class=@glimmer/component
```

Since not every component will necessarily have some defined behavior associated with it, the component generator does not generate the JavaScript parts of the file for us by default. As we saw earlier, we can always add the JavaScript class to a component later on.

However, in the case of our `<Map>` component, we are pretty sure that we are going to need a JavaScript file for some behavior that we have yet to define! To save a step later, we can pass the `--component-class=@glimmer/component` flag to the component generator so that we have everything we need from the get-go.

> Zoey says...
>
> Too much typing? Use `ember g component map -gc` instead. The `-gc` flag stands for **G**limmer **c**omponent, but you may also remember it as **g**enerate **c**lass.

```run:command hidden=true cwd=super-rentals
pnpm test
git add app/components/map.gjs
git add tests/integration/components/map-test.gjs
```

## Parameterizing Components with Arguments

Let's update our component:

```run:file:patch lang=gjs cwd=super-rentals filename=app/components/map.gjs
@@ -1,6 +1,18 @@
 import Component from '@glimmer/component';
+import ENV from 'super-rentals/config/environment';
 
 export default class Map extends Component {
+  get token() {
+    return encodeURIComponent(ENV.TOMTOM_ACCESS_TOKEN);
+  }
+
   <template>
-    {{yield}}
+    <div class="map">
+      <img
+        alt="Map image at coordinates {{@lat}},{{@lng}}"
+        ...attributes
+        src="https://api.tomtom.com/map/1/staticimage?key={{this.token}}&zoom={{@zoom}}&center={{@lng}},{{@lat}}&width={{@width}}&height={{@height}}"
+        width={{@width}} height={{@height}}
+      >
+    </div>
   </template>
```

Here, we import the access token from the config file and return it from a `token` *[getter](https://javascript.info/property-accessors)*. This allows us to access our token as `this.token` both inside the `Map` class body, as well as the template section. It is also important to [URL-encode](https://javascript.info/url#encoding-strings) the token, just in case it contains any special characters that are not URL-safe.

First, we have a container element for styling purposes.

Then we have an `<img>` tag to request and render the static map image from TomTom.

Our component's template contains several values that don't yet exist&mdash;`@lat`, `@lng`, `@zoom`, `@width`, and `@height`. These are *[arguments](../../../components/component-arguments-and-html-attributes/#toc_arguments)* to the `<Map>` component that we will supply when invoking it.

By *[parameterizing][TODO: link to parameterizing]* our component using arguments, we made a reusable component that can be invoked from different parts of the app and customized to meet the needs for those specific contexts. We have already seen this in action when using the `<LinkTo>` component [earlier](../building-pages/); we had to specify a `@route` argument so that it knew what page to navigate to.

We supplied a reasonable default value for the `alt` attribute based on the values of the `@lat` and `@lng` arguments. You may notice that we are directly *[interpolating][TODO: link to interpolating]* values into the `alt` attribute's value. Ember will automatically concatenate these interpolated values into a final string value for us, including doing any necessary HTML-escaping.

## Overriding HTML Attributes in `...attributes`

Next, we used `...attributes` to allow the invoker to further customize the `<img>` tag, such as passing extra attributes such as `class`, as well as *[overriding][TODO: link to overriding]* our default `alt` attribute with a more specific or human-friendly one.

*The ordering is important here!* Ember applies the attributes in the order that they appear. By assigning the default `alt` attribute first (*before* `...attributes` is applied), we are explicitly providing the invoker the *option* to provide a more tailored `alt` attribute according to their use case.

Since the passed-in `alt` attribute (if any exists) will appear *after* ours, it will override the value we specified. On the other hand, it is important that we assign `src`, `width`, and `height` after `...attributes`, so that they don't get accidentally overwritten by the invoker.

The `src` attribute interpolates all the required parameters into the URL format for TomTom's [static map image API](https://developer.tomtom.com/map-display-api/documentation/raster/static-image), including the URL-escaped access token from `this.token`.

Finally, since we are using the `@2x` "retina" image, we should specify the `width` and `height` attributes. Otherwise, the `<img>` will be rendered at twice the size than what we expected!

We just added a lot of behavior into a single component, so let's write some tests! In particular, we should make sure to have some *[test coverage](../../../testing/)* for the overriding-HTML-attributes behavior we discussed above.

```run:file:patch lang=gjs cwd=super-rentals filename=tests/integration/components/map-test.gjs
@@ -2,3 +2,4 @@ import { module, test } from 'qunit';
 import { setupRenderingTest } from 'super-rentals/tests/helpers';
-import { render } from '@ember/test-helpers';
+import { render, find } from '@ember/test-helpers';
+import ENV from 'super-rentals/config/environment';
 import Map from 'super-rentals/components/map';
@@ -8,20 +9,79 @@ module('Integration | Component | map', function (hooks) {
 
-  test('it renders', async function (assert) {
-    // Updating values is achieved using autotracking, just like in app code. For example:
-    // class State { @tracked myProperty = 0; }; const state = new State();
-    // and update using state.myProperty = 1; await rerender();
-    // Handle any actions with function myAction(val) { ... };
+  test('it renders a map image for the specified parameters', async function (assert) {
+    await render(<template>
+      <Map
+        @lat="37.7797"
+        @lng="-122.4184"
+        @zoom="10"
+        @width="150"
+        @height="120"
+      />
+    </template>);
+
+    assert
+      .dom('.map img')
+      .exists()
+      .hasAttribute('alt', 'Map image at coordinates 37.7797,-122.4184')
+      .hasAttribute('src')
+      .hasAttribute('width', '150')
+      .hasAttribute('height', '120');
+
+    let { src } = find('.map img');
+    let token = encodeURIComponent(ENV.TOMTOM_ACCESS_TOKEN);
+
+    assert.ok(
+      src.startsWith('https://api.tomtom.com/'),
+      'the src starts with "https://api.tomtom.com/"',
+    );
+
+    assert.ok(
+      src.includes('zoom=10'),
+      'the src should include the zoom parameter',
+    );
 
-    await render(<template><Map /></template>);
+    assert.ok(
+      src.includes('center=-122.4184,37.7797'),
+      'the src should include the lng,lat parameter',
+    );
 
-    assert.dom().hasText('');
+    assert.ok(
+      src.includes(`key=${token}`),
+      'the src should include the escaped access token',
+    );
+  });
+
+  test('the default alt attribute can be overridden', async function (assert) {
+    await render(<template>
+      <Map
+        @lat="37.7797"
+        @lng="-122.4184"
+        @zoom="10"
+        @width="150"
+        @height="120"
+        alt="A map of San Francisco"
+      />
+    </template>);
+
+    assert.dom('.map img').hasAttribute('alt', 'A map of San Francisco');
+  });
 
-    // Template block usage:
+  test('the src, width and height attributes cannot be overridden', async function (assert) {
     await render(<template>
-      <Map>
-        template block text
-      </Map>
+      <Map
+        @lat="37.7797"
+        @lng="-122.4184"
+        @zoom="10"
+        @width="150"
+        @height="120"
+        src="/assets/images/teaching-tomster.png"
+        width="200"
+        height="300"
+      />
     </template>);
 
-    assert.dom().hasText('template block text');
+    assert
+      .dom('.map img')
+      .hasAttribute('src', /^https:\/\/api\.tomtom\.com\//)
+      .hasAttribute('width', '150')
+      .hasAttribute('height', '120');
   });
```

Note that the `hasAttribute` test helper from [`qunit-dom`](https://github.com/simplabs/qunit-dom/blob/master/API.md) supports using *[regular expressions](https://javascript.info/regexp-introduction)*. We used this feature to confirm that the `src` attribute starts with `https://api.tomtom.com/`, as opposed to requiring it to be an exact match against a string. This allows us to be reasonably confident that the code is working correctly, without being overly-detailed in our tests.

*Fingers crossed...* Let's run our tests.

```run:command hidden=true cwd=super-rentals
pnpm test
git add app/components/map.gjs
git add tests/integration/components/map-test.gjs
```

```run:screenshot width=1024 height=768 retina=true filename=pass.png alt="Tests passing with the new <Map> tests"
visit http://localhost:4200/tests?nocontainer&nolint&deterministic
wait  #qunit-banner.qunit-pass
```

Hey, all the tests passed! But does that mean it actually works in practice? Let's find out by invoking the `<Map>` component from the `<Rental>` component's template:

```run:file:patch lang=gjs cwd=super-rentals filename=app/components/rental.gjs
@@ -1,2 +1,3 @@
 import RentalImage from 'super-rentals/components/rental/image';
+import Map from 'super-rentals/components/map';
 
@@ -23,2 +24,10 @@ import RentalImage from 'super-rentals/components/rental/image';
     </div>
+    <Map
+      @lat="37.7749"
+      @lng="-122.4194"
+      @zoom="9"
+      @width="150"
+      @height="150"
+      alt="A map of Grand Old Mansion"
+    />
   </article>
```

Hey! That's a map!

```run:screenshot width=1024 retina=true filename=three-old-mansions.png alt="Three Grand Old Mansions"
visit http://localhost:4200/?deterministic
wait  .rentals li:nth-of-type(3) article.rental .map
```

<!-- TODO: https://github.com/ember-cli/ember-cli/issues/8782 -->

> Zoey says...
>
> If the map image failed to load, make sure you have the correct `TOMTOM_ACCESS_TOKEN` set in `config/environment.js`. Don't forget to restart the development and test servers after editing your config file!

For good measure, we will also add an assertion to the `<Rental>` tests to make sure we rendered the `<Map>` component successfully.

```run:file:patch lang=gjs cwd=super-rentals filename=tests/integration/components/rental-test.gjs
@@ -18,2 +18,3 @@ module('Integration | Component | rental', function (hooks) {
     assert.dom('article .image').exists();
+    assert.dom('article .map').exists();
   });
```

```run:command hidden=true cwd=super-rentals
pnpm test
git add app/components/rental.gjs
git add tests/integration/components/rental-test.gjs
```

## Refactoring with Getters and Auto-track

At this point, a big part of our `<Map>` component's template section is devoted to the `<img>` tag's `src` attribute, which is getting pretty long. One alternative is to move this computation into the JavaScript class instead.

From within our JavaScript class, we have access to our component's arguments using the `this.args.*` API. Using that, we can move the URL logic up from the template into a new getter.

> Zoey says...
>
> `this.args` is an API provided by the Glimmer component superclass. You may come across other component superclasses, such as "classic" components in legacy codebases, that provide different APIs for accessing component arguments from JavaScript code.

```run:file:patch lang=js cwd=super-rentals filename=app/components/map.gjs
@@ -3,3 +3,15 @@ import ENV from 'super-rentals/config/environment';
 
+const TOMTOM_API = 'https://api.tomtom.com/map/1/staticimage';
+
 export default class Map extends Component {
+  get src() {
+    let { lng, lat, width, height, zoom } = this.args;
+
+    let coordinates = `&zoom=${zoom}&center=${lng},${lat}`;
+    let dimensions = `&width=${width}&height=${height}`;
+    let accessToken = `?key=${this.token}`;
+
+    return `${TOMTOM_API}${accessToken}${coordinates}${dimensions}`;
+  }
+
   get token() {
@@ -13,3 +25,3 @@ export default class Map extends Component {
         ...attributes
-        src="https://api.tomtom.com/map/1/staticimage?key={{this.token}}&zoom={{@zoom}}&center={{@lng}},{{@lat}}&width={{@width}}&height={{@height}}"
+        src={{this.src}}
         width={{@width}} height={{@height}}
```

Much nicer! And all of our tests still pass!

```run:command hidden=true cwd=super-rentals
pnpm test
git add app/components/map.gjs
```

```run:screenshot width=1024 height=768 retina=true filename=pass-2.png alt="Tests passing after the src getter refactor"
visit http://localhost:4200/tests?nocontainer&nolint&deterministic
wait  #qunit-banner.qunit-pass
```

Note that we did not mark our getter as `@tracked`. Unlike instance variables, getters cannot be "assigned" a new value directly, so it does not make sense for Ember to monitor them for changes.

That being said, the values *produced* by getters can certainly change. In our case, the value produced by our `src` getter depends on the values of `lat`, `lng`, `width`, `height` and `zoom` from `this.args`. Whenever these *[dependencies][TODO: link to dependencies]* get updated, we would expect `{{this.src}}` from our template to be updated accordingly.

Ember does this by automatically tracking any variables that were accessed while computing a getter's value. As long as the dependencies themselves are marked as `@tracked`, Ember knows exactly when to invalidate and re-render any templates that may potentially contain any "stale" and outdated getter values. This feature is also known as *[auto-track](../../../in-depth-topics/autotracking-in-depth/)*. All arguments that can be accessed from `this.args` (in other words, `this.args.*`) are implicitly marked as `@tracked` by the Glimmer component superclass. Since we inherited from that superclass, everything Just Works&trade;.

## Getting JavaScript Values into the Test Context

Just to be sure, we can add a test for this behavior:

```run:file:patch lang=gjs cwd=super-rentals filename=tests/integration/components/map-test.gjs
@@ -2,5 +2,6 @@ import { module, test } from 'qunit';
 import { setupRenderingTest } from 'super-rentals/tests/helpers';
-import { render, find } from '@ember/test-helpers';
+import { render, find, rerender } from '@ember/test-helpers';
 import ENV from 'super-rentals/config/environment';
 import Map from 'super-rentals/components/map';
+import { tracked } from '@glimmer/tracking';
 
@@ -52,2 +53,82 @@ module('Integration | Component | map', function (hooks) {
 
+  test('it updates the `src` attribute when the arguments change', async function (assert) {
+    class State { 
+      @tracked lat = 37.7749;
+      @tracked lng = -122.4194;
+      @tracked zoom = 10;
+      @tracked width = 150;
+      @tracked height = 120;
+    };
+
+    const state = new State();
+
+    await render(<template>
+      <Map
+        @lat={{state.lat}}
+        @lng={{state.lng}}
+        @zoom={{state.zoom}}
+        @width={{state.width}}
+        @height={{state.height}}
+      />
+    </template>);
+
+    let img = find('.map img');
+
+    assert.ok(
+      img.src.includes('zoom=10'),
+      'the src should include the zoom parameter',
+    );
+
+    assert.ok(
+      img.src.includes('-122.4194,37.7749'),
+      'the src should include the lng,lat parameter',
+    );
+
+    assert.ok(
+      img.src.includes('width=150'),
+      'the src should include the width parameter',
+    );
+
+    assert.ok(
+      img.src.includes('height=120'),
+      'the src should include the height parameter',
+    );
+
+    state.width = 300;
+    state.height = 200;
+    state.zoom = 12;
+
+    await rerender();
+
+    assert.ok(
+      img.src.includes('-122.4194,37.7749'),
+      'the src should still include the lng,lat parameter',
+    );
+
+    assert.ok(
+      img.src.includes('width=300'),
+      'the src should include the updated width parameter',
+    );
+
+    assert.ok(
+      img.src.includes('height=200'),
+      'the src should include the updated height parameter',
+    );
+
+    assert.ok(
+      img.src.includes('zoom=12'),
+      'the src should include the updated zoom parameter',
+    );
+
+    state.lat = 47.6062;
+    state.lng = -122.3321;
+
+    await rerender();
+
+    assert.ok(
+      img.src.includes('center=-122.3321,47.6062'),
+      'the src should include the updated lng,lat parameter',
+    );
+  });
+
   test('the default alt attribute can be overridden', async function (assert) {
```

In this test, we create a local class called `State` and an instance of that class called `state`. There is nothing special about the name `State`&mdash;it's just a regular JavaScript class we use to keep track of data we might want to pass into our component. We use the `@tracked` decorator just like in the application code so whenever we make a change, Ember will update the page automatically.

In tests like this, whenever we make changes to state that is rendered, we call `await rerender()`. This gives Ember a chance to update the display before continuing with the queries and assertions that follow. Following this pattern allows us to update these values as needed from the test function.

With all our tests passing, we are ready to move on!

```run:command hidden=true cwd=super-rentals
pnpm test
git add tests/integration/components/map-test.gjs
```

```run:screenshot width=1024 height=768 retina=true filename=pass-3.png alt="All our tests are passing"
visit http://localhost:4200/tests?nocontainer&nolint&deterministic
wait  #qunit-banner.qunit-pass
```

```run:server:stop
npm start
```

```run:checkpoint cwd=super-rentals
Chapter 7
```

