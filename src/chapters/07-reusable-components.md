The last missing feature for the `<Rental>` component is a map to show the location of the rental, which is what we're going to work on next.

<!-- TODO: add screen shot of the end state -->

While adding the map, you will learn about:
* Managing application-level configurations
* Parameterizing components with arguments
* Accessing component arguments
* Interpolating values in templates
* Overriding HTML attributes in `...attributes`
* Refactoring with getters and auto-track
* Getting JavaScript values into the test context

## Managing Application-level Configurations

We will use the [Mapbox](https://www.mapbox.com) API to generate maps for our rental properties. You can [sign up](https://www.mapbox.com/signup/) for free and without a credit card.

Mapbox provides a [static map images API](https://docs.mapbox.com/api/maps/#static-images), which serves map images in PNG format. This means that we can generate the appropriate URL for the parameters we want and render the map using a standard `<img>` tag. Pretty neat!

If you're curious, you can explore the options available on Mapbox by using the [interactive playground](https://docs.mapbox.com/help/interactive-tools/static-api-playground/).

Once you have signed up for the service, grab your *[default public token](https://account.mapbox.com/access-tokens/)* and paste it into `config/environment.js`:

```run:file:patch lang=js cwd=super-rentals filename=config/environment.js
@@ -50,2 +50,4 @@

+  ENV.MAPBOX_ACCESS_TOKEN = 'paste your Mapbox access token here';
+
   return ENV;
```

As its name implies, `config/environment.js` is used to *configure* our app and store API keys like these. These values can be accessed from other parts of our app, and they can have different values depending on the current environment (which might be development, test, or production).

> Zoey says...
>
> If you prefer, you can [create different Mapbox access tokens](https://account.mapbox.com/access-tokens/) for use in different environments. At a minimum, the tokens will each need to have the "styles:tiles" scope in order to use Mapbox's static images API.

```run:command hidden=true cwd=super-rentals
yarn test
git add config/environment.js
```

```run:file:patch hidden=true cwd=super-rentals filename=config/environment.js
@@ -50,3 +50,3 @@

-  ENV.MAPBOX_ACCESS_TOKEN = 'paste your Mapbox access token here';
+  ENV.MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

```

```run:command hidden=true cwd=super-rentals
yarn test
git add config/environment.js
```

After saving the changes to our configuration file, we will need to restart our development server to pick up these file changes. Unlike the files we have edited so far, `config/environment.js` is not automatically reloaded.

<!-- TODO: https://github.com/ember-cli/ember-cli/issues/8782 -->

You can stop the server by finding the terminal window where `ember server` is running, then type `Ctrl + C`. That is, typing the "C" key on your keyboard *while* holding down the "Ctrl" key at the same time. Once it has stopped, you can start it back up again with the same `ember server` command.

```run:server:start cwd=super-rentals expect="Serving on http://localhost:4200/"
#[cfg(all(ci, unix))]
#[display(ember server)]
ember server | awk '{ \
  gsub("Build successful \\([0-9]+ms\\)", "Build successful (13286ms)"); \
  print; \
  system("") # https://unix.stackexchange.com/a/83853 \
}'

#[cfg(not(all(ci, unix)))]
ember server
```

## Generating a Component with a Component Class

With the Mapbox API key in place, let's generate a new component for our map.

```run:command cwd=super-rentals
ember generate component map --with-component-class
```

Since not every component will necessarily have some defined behavior associated with it, the component generator does not generate a JavaScript file for us by default. As we saw earlier, we can always use the `component-class` generator to add a JavaScript file for a component later on.

However, in the case of our `<Map>` component, we are pretty sure that we are going to need a JavaScript file for some behavior that we have yet to define! To save a step later, we can pass the `--with-component-class` flag to the component generator so that we have everything we need from the get-go.

> Zoey says...
>
> Too much typing? Use `ember g component map -gc` instead. The `-gc` flag stands for **G**limmer **c**omponent, but you may also remember it as **g**enerate **c**lass.

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/map.hbs
git add app/components/map.js
git add tests/integration/components/map-test.js
```

## Parameterizing Components with Arguments

Let's start with our JavaScript file:

```run:file:patch lang=js cwd=super-rentals filename=app/components/map.js
@@ -1,4 +1,8 @@
 import Component from '@glimmer/component';
+import ENV from 'super-rentals/config/environment';

 export default class MapComponent extends Component {
+  get token() {
+    return encodeURIComponent(ENV.MAPBOX_ACCESS_TOKEN);
+  }
 }
```

Here, we import the access token from the config file and return it from a `token` *[getter][TODO: link to getter]*. This allows us to access our token as `this.token` both inside the `MapComponent` class body, as well as the component's template. It is also important to [URL-encode][TODO: link to URL-encode] the token, just in case it contains any special characters that are not URL-safe.

## Interpolating Values in Templates

Now, let's move from the JavaScript file to the template:

```run:file:patch lang=handlebars cwd=super-rentals filename=app/components/map.hbs
@@ -1 +1,8 @@
-{{yield}}
\ No newline at end of file
+<div class="map">
+  <img
+    alt="Map image at coordinates {{@lat}},{{@lng}}"
+    ...attributes
+    src="https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/{{@lng}},{{@lat}},{{@zoom}}/{{@width}}x{{@height}}@2x?access_token={{this.token}}"
+    width={{@width}} height={{@height}}
+  >
+</div>
```

First, we have a container element for styling purposes.

Then we have an `<img>` tag to request and render the static map image from Mapbox.

Our template contains several values that don't yet exist &mdash; `@lat`, `@lng`, `@zoom`, `@width`, and `@height`. These are *[arguments][TODO: link to arguments]* to the `<Map>` component that we will supply when invoking it.

By *[parameterizing][TODO: link to parameterizing]* our component using arguments, we made a reusable component that can be invoked from different parts of the app and customized to meet the needs for those specific contexts. We have already seen this in action when using the `<LinkTo>` component [earlier](../02-building-pages/); we had to specify a `@route` argument so that it knew what page to navigate to.

We supplied a reasonable default value for the `alt` attribute based on the values of the `@lat` and `@lng` arguments. You may notice that we are directly *[interpolating][TODO: link to interpolating]* values into the `alt` attribute's value. Ember will automatically concatenate these interpolated values into a final string value for us, including doing any necessary HTML-escaping.

## Overriding HTML Attributes in `...attributes`

Next, we used `...attributes` to allow the invoker to further customize the `<img>` tag, such as passing extra attributes such as `class`, as well as *[overriding][TODO: link to overriding]* our default `alt` attribute with a more specific or human-friendly one.

*The ordering is important here!* Ember applies the attributes in the order that they appear. By assigning the default `alt` attribute first (*before* `...attributes` is applied), we are explicitly providing the invoker the *option* to provide a more tailored `alt` attribute according to their use case.

Since the passed-in `alt` attribute (if any exists) will appear _after_ ours, it will override the value we specified. On the other hand, it is important that we assign `src`, `width`, and `height` after `...attributes`, so that they don't get accidentally overwritten by the invoker.

The `src` attribute interpolates all the required parameters into the URL format for Mapbox's [static map image API](https://docs.mapbox.com/api/maps/#static-images), including the URL-escaped access token from `this.token`.

Finally, since we are using the `@2x` "retina" image, we should specify the `width` and `height` attributes. Otherwise, the `<img>` will be rendered at twice the size than what we expected!

We just added a lot of behavior into a single component, so let's write some tests! In particular, we should make sure to have some *[test coverage][TODO: link to test coverage]* for the overriding-HTML-attributes behavior we discussed above.

```run:file:patch lang=js cwd=super-rentals filename=tests/integration/components/map-test.js
@@ -2,4 +2,5 @@
 import { setupRenderingTest } from 'ember-qunit';
-import { render } from '@ember/test-helpers';
+import { render, find } from '@ember/test-helpers';
 import { hbs } from 'ember-cli-htmlbars';
+import ENV from 'super-rentals/config/environment';

@@ -8,18 +9,53 @@

-  test('it renders', async function(assert) {
-    // Set any properties with this.set('myProperty', 'value');
-    // Handle any actions with this.set('myAction', function(val) { ... });
-
-    await render(hbs`<Map />`);
-
-    assert.equal(this.element.textContent.trim(), '');
-
-    // Template block usage:
-    await render(hbs`
-      <Map>
-        template block text
-      </Map>
-    `);
-
-    assert.equal(this.element.textContent.trim(), 'template block text');
+  test('it renders a map image for the specified parameters', async function(assert) {
+    await render(hbs`<Map
+      @lat="37.7797"
+      @lng="-122.4184"
+      @zoom="10"
+      @width="150"
+      @height="120"
+    />`);
+
+    assert.dom('.map').exists();
+    assert.dom('.map img').hasAttribute('alt', 'Map image at coordinates 37.7797,-122.4184');
+    assert.dom('.map img').hasAttribute('src', /^https:\/\/api\.mapbox\.com/, 'the src starts with "https://api.mapbox.com"');
+    assert.dom('.map img').hasAttribute('width', '150');
+    assert.dom('.map img').hasAttribute('height', '120');
+
+    let { src } = find('.map img');
+    let token = encodeURIComponent(ENV.MAPBOX_ACCESS_TOKEN);
+
+    assert.ok(src.includes('-122.4184,37.7797,10'), 'the src should include the lng,lat,zoom parameter');
+    assert.ok(src.includes('150x120@2x'), 'the src should include the width,height and @2x parameter');
+    assert.ok(src.includes(`access_token=${token}`), 'the src should include the escaped access token');
+  });
+
+  test('the default alt attribute can be overridden', async function(assert) {
+    await render(hbs`<Map
+      @lat="37.7797"
+      @lng="-122.4184"
+      @zoom="10"
+      @width="150"
+      @height="120"
+      alt="A map of San Francisco"
+    />`);
+
+    assert.dom('.map img').hasAttribute('alt', 'A map of San Francisco');
+  });
+
+  test('the src, width and height attributes cannot be overridden', async function(assert) {
+    await render(hbs`<Map
+      @lat="37.7797"
+      @lng="-122.4184"
+      @zoom="10"
+      @width="150"
+      @height="120"
+      src="/assets/images/teaching-tomster.png"
+      width="200"
+      height="300"
+    />`);
+
+    assert.dom('.map img').hasAttribute('src', /^https:\/\/api\.mapbox\.com/, 'the src starts with "https://api.mapbox.com"');
+    assert.dom('.map img').hasAttribute('width', '150');
+    assert.dom('.map img').hasAttribute('height', '120');
   });
```

Note that the `hasAttribute` test helper from [`qunit-dom`][TODO: link to qunit-dom] supports using *[regular expressions][TODO: link to regular expressions]*. We used this feature to confirm that the `src` attribute starts with `https://api.mapbox.com/`, as opposed to requiring it to be an exact match against a string. This allows us to be reasonably confident that the code is working correctly, without being overly-detailed in our tests.

*Fingers crossed...* Let's run our tests.

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/map.hbs
git add app/components/map.js
git add tests/integration/components/map-test.js
```

```run:screenshot width=1024 height=768 retina=true filename=pass.png alt="Tests passing with the new <Map> tests"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

Hey, all the tests passed! But does that mean it actually works in practice? Let's find out by invoking the `<Map>` component from the `<Rental>` component's template:

```run:file:patch lang=handlebars cwd=super-rentals filename=app/components/rental.hbs
@@ -20,2 +20,10 @@
   </div>
+  <Map
+    @lat="37.7749"
+    @lng="-122.4194"
+    @zoom="9"
+    @width="150"
+    @height="150"
+    alt="A map of Grand Old Mansion"
+  />
 </article>
```

Hey! That's a map!

```run:screenshot width=1024 retina=true filename=three-old-mansions.png alt="Three Grand Old Mansions"
visit http://localhost:4200/
wait  .rentals li:nth-of-type(3) article.rental .map
```

<!-- TODO: https://github.com/ember-cli/ember-cli/issues/8782 -->

> Zoey says...
>
> If the map image failed to load, make sure you have the correct `MAPBOX_ACCESS_TOKEN` set in `config/environment.js`. Don't forget to restart the development and test servers after editing your config file!

For good measure, we will also add an assertion to the `<Rental>` tests to make sure we rendered the `<Map>` component successfully.

```run:file:patch lang=js cwd=super-rentals filename=tests/integration/components/rental-test.js
@@ -18,2 +18,3 @@
     assert.dom('article .image').exists();
+    assert.dom('article .map').exists();
   });
```

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/rental.hbs
git add tests/integration/components/rental-test.js
```

## Refactoring with Getters and Auto-track

At this point, a big part of our `<Map>` template is devoted to the `<img>` tag's `src` attribute, which is getting pretty long. One alternative is to move this computation into the JavaScript class instead.

From within our JavaScript class, we have access to our component's arguments using the `this.args.*` API. Using that, we can move the URL logic from the template into a new getter.

> Zoey says...
>
> `this.args` is an API provided by the Glimmer component superclass. You may come across other component superclasses, such as "classic" components in legacy codebases, that provide different APIs for accessing component arguments from JavaScript code.

```run:file:patch lang=js cwd=super-rentals filename=app/components/map.js
diff --git a/app/components/map.js b/app/components/map.js
index 78e765f..1cad468 100644
--- a/app/components/map.js
+++ b/app/components/map.js
@@ -3,3 +3,15 @@

+const MAPBOX_API = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static';
+
 export default class MapComponent extends Component {
+  get src() {
+    let { lng, lat, width, height, zoom } = this.args;
+
+    let coordinates = `${lng},${lat},${zoom}`;
+    let dimensions  = `${width}x${height}`;
+    let accessToken = `access_token=${this.token}`;
+
+    return `${MAPBOX_API}/${coordinates}/${dimensions}@2x?${accessToken}`;
+  }
+
   get token() {
```

```run:file:patch lang=handlebars cwd=super-rentals filename=app/components/map.hbs
@@ -4,3 +4,3 @@
     ...attributes
-    src="https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/{{@lng}},{{@lat}},{{@zoom}}/{{@width}}x{{@height}}@2x?access_token={{this.token}}"
+    src={{this.src}}
     width={{@width}} height={{@height}}
```

Much nicer! And all of our tests still pass!

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/map.hbs
git add app/components/map.js
```

```run:screenshot width=1024 height=768 retina=true filename=pass-2.png alt="Tests passing after the src getter refactor"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

Note that we did not mark our getter as `@tracked`. Unlike instance variables, getters cannot be "assigned" a new value directly, so it does not make sense for Ember to monitor them for changes.

That being said, the values _produced_ by getters can certainly change. In our case, the value produced by our `src` getter depends on the values of `lat`, `lng`, `width`, `height` and `zoom` from `this.args`. Whenever these *[dependencies][TODO: link to dependencies]* get updated, we would expect `{{this.src}}` from our template to be updated accordingly.

Ember does this by automatically tracking any variables that were accessed while computing a getter's value. As long as the dependencies themselves are marked as `@tracked`, Ember knows exactly when to invalidate and re-render any templates that may potentially contain any "stale" and outdated getter values. This feature is also known as *[auto-track][TODO: link to auto-track]*. All arguments that can be accessed from `this.args` (in other words, `this.args.*`) are implicitly marked as `@tracked` by the Glimmer component superclass. Since we inherited from that superclass, everything Just Works&trade;.

## Getting JavaScript Values into the Test Context

Just to be sure, we can add a test for this behavior:

```run:file:patch lang=js cwd=super-rentals filename=tests/integration/components/map-test.js
@@ -32,2 +32,42 @@

+  test('it updates the `src` attribute when the arguments change', async function(assert) {
+    this.setProperties({
+      lat: 37.7749,
+      lng: -122.4194,
+      zoom: 10,
+      width: 150,
+      height: 120,
+    });
+
+    await render(hbs`<Map
+      @lat={{this.lat}}
+      @lng={{this.lng}}
+      @zoom={{this.zoom}}
+      @width={{this.width}}
+      @height={{this.height}}
+    />`);
+
+    let img = find('.map img');
+
+    assert.ok(img.src.includes('-122.4194,37.7749,10'), 'the src should include the lng,lat,zoom parameter');
+    assert.ok(img.src.includes('150x120@2x'), 'the src should include the width,height and @2x parameter');
+
+    this.setProperties({
+      width: 300,
+      height: 200,
+      zoom: 12,
+    });
+
+    assert.ok(img.src.includes('-122.4194,37.7749,12'), 'the src should include the lng,lat,zoom parameter');
+    assert.ok(img.src.includes('300x200@2x'), 'the src should include the width,height and @2x parameter');
+
+    this.setProperties({
+      lat: 47.6062,
+      lng: -122.3321,
+    });
+
+    assert.ok(img.src.includes('-122.3321,47.6062'), 'the src should include the lng,lat,zoom parameter');
+    assert.ok(img.src.includes('300x200@2x'), 'the src should include the width,height and @2x parameter');
+  });
+
   test('the default alt attribute can be overridden', async function(assert) {
```

Using the special `this.setProperties` testing API, we can pass arbitrary values into our component.

Note that the value of `this` here does _not_ refer to the component instance. We are not directly accessing or modifying the component's internal states (that would be extremely rude!).

Instead, `this` refers to a special *[test context][TODO: link to test context]* object, which we have access to inside the `render` helper. This provides a "bridge" for us to pass dynamic values, in the form of arguments, into our invocation of the component. This allows us to update these values as needed from the test function.

With all our tests passing, we are ready to move on!

```run:command hidden=true cwd=super-rentals
yarn test
git add tests/integration/components/map-test.js
```

```run:screenshot width=1024 height=768 retina=true filename=pass-3.png alt="All our tests are passing"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

```run:server:stop
ember server
```

```run:checkpoint cwd=super-rentals
Chapter 7
```
