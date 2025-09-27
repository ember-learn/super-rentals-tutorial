<!--lint disable no-undefined-references-->

```run:server:start hidden=true cwd=super-rentals expect="Serving on http://localhost:4200/"
npm start
```

Now that we are fetching real data from our "server", let's add a new feature — dedicated pages for each of our rentals:

![The Super Rentals app (rentals page) by the end of the chapter](/images/tutorial/part-2/route-params/grand-old-mansion@2x.png)

While adding these rental pages, you will learn about:
* Routes with dynamic segments
* Links with dynamic segments
* Component tests with access to the router
* Accessing parameters from dynamic segments
* Sharing common setup code between tests

## Routes with Dynamic Segments

It would be great for our individual rental pages to be available through predictable URLs like `/rentals/grand-old-mansion`. Also, since these pages are dedicated to individual rentals, we can show more detailed information about each property on this page. It would also be nice to be able to have a way to bookmark a rental property, and share direct links to each individual rental listing so that our users can come back to these pages later on, after they are done browsing.

But first things first: we need to add a route for this new page. We can do that by adding a `rental` route to the router.

```run:file:patch lang=js cwd=super-rentals filename=app/router.js
@@ -11,2 +11,3 @@
   this.route('contact', { path: '/getting-in-touch' });
+  this.route('rental', { path: '/rentals/:rental_id' });
 });
```

Notice that we are doing something a little different here. Instead of using the default path (`/rental`), we're specifying a custom path. Not only are we using a custom path, but we're also passing in a `:rental_id`, which is what we call a *[dynamic segment](../../../routing/defining-your-routes/#toc_dynamic-segments)*. When these routes are evaluated, the `rental_id` will be substituted with the `id` of the individual rental property that we are trying to navigate to.

```run:command hidden=true cwd=super-rentals
git add app/router.js
```

## Links with Dynamic Segments

Now that we have this route in place, we can update our `<Rental>` component to actually *link* to each of our detailed rental properties!

```run:file:patch lang=gjs cwd=super-rentals filename=app/components/rental.gjs
@@ -2,2 +2,3 @@ import RentalImage from 'super-rentals/components/rental/image';
 import Map from 'super-rentals/components/map';
+import { LinkTo } from '@ember/routing';
 
@@ -10,3 +11,7 @@ import Map from 'super-rentals/components/map';
     <div class="details">
-      <h3>{{@rental.title}}</h3>
+      <h3>
+        <LinkTo @route="rental" @model={{@rental}}>
+          {{@rental.title}}
+        </LinkTo>
+      </h3>
       <div class="detail owner">
```

Since we know that we're linking to the `rental` route that we just created, we also know that this route requires a dynamic segment. Thus, we need to pass in a `@model` argument so that the `<LinkTo>` component can generate the appropriate URL for that model.

```run:command hidden=true cwd=super-rentals
git add app/components/rental.gjs
```

Let's see this in action. If we go back to our browser and refresh the page, we should see our links, but something isn't quite right yet!

```run:screenshot width=1024 retina=true filename=broken-links.png alt="Broken links"
visit http://localhost:4200/?deterministic
```

The links are all pointing to `/rentals/undefined`. Yikes! This is because `<LinkTo>` tries to use the `id` property from our model in order to replace the dynamic segment and generate the URL.

So what's the problem here? Well, our model doesn't actually have an `id` property! So *of course* the `<LinkTo>` component isn't going to be able to find it and use it to generate the URL. Oops!

Thankfully, we can fix this pretty easily. As it turns out, the data that is returned by our server&mdash;the JSON data that lives in our `public/api` folder&mdash;actually does have an `id` attribute on it. We can double check this by going to `http://localhost:4200/api/rentals.json`.

```run:screenshot width=1024 height=512 retina=true filename=data.png alt="Our data do have an id attribute"
visit http://localhost:4200/api/rentals.json
```

If we look at the JSON data here, we can see that the `id` is included right alongside the `attributes` key. So we have access to this data; the only trouble is that we're not including it in our model! Let's change our model hook in the `index` route so that it includes the `id`.

```run:file:patch lang=js cwd=super-rentals filename=app/routes/index.js
@@ -14,3 +14,3 @@
     return data.map((model) => {
-      let { attributes } = model;
+      let { id, attributes } = model;
       let type;
@@ -23,3 +23,3 @@

-      return { type, ...attributes };
+      return { id, type, ...attributes };
     });
```

Now that we've included our model's `id`, we should see the correct URLs to each rental property on our index page after refreshing the page.

```run:command hidden=true cwd=super-rentals
git add app/routes/index.js
```

## Component Tests with Access to the Router

Alright, we have just one more step left here: updating the tests. We can add an `id` to the rental that we defined in our test using `setProperties` and add an assertion for the expected URL, too.

```run:file:patch lang=gjs cwd=super-rentals filename=tests/integration/components/rental-test.gjs
@@ -12,2 +12,3 @@ module('Integration | Component | rental', function (hooks) {
       @tracked rental = {
+        id: 'grand-old-mansion',
         title: 'Grand Old Mansion',
@@ -35,2 +36,5 @@ module('Integration | Component | rental', function (hooks) {
     assert.dom('article h3').hasText('Grand Old Mansion');
+    assert
+      .dom('article h3 a')
+      .hasAttribute('href', '/rentals/grand-old-mansion');
     assert.dom('article .detail.owner').includesText('Veruca Salt');
```

```run:command hidden=true cwd=super-rentals
git add tests/integration/components/rental-test.gjs
```

If we run the tests in the browser, everything should just pass!

```run:screenshot width=1024 height=768 retina=true filename=pass.png alt="Tests are passing"
visit http://localhost:4200/tests?nocontainer&nolint&deterministic
wait  #qunit-banner.qunit-pass
```

## Accessing Parameters from Dynamic Segments

Awesome! We're making such great progress.

Now that we have our `rental` route, let's finish up our `rental` page. The first step to doing this is making our route actually *do* something. We added the route, but we haven't actually implemented it. So let's do that first by creating the route file.

```run:file:create lang=js cwd=super-rentals filename=app/routes/rental.js
import Route from '@ember/routing/route';

const COMMUNITY_CATEGORIES = ['Condo', 'Townhouse', 'Apartment'];

export default class RentalRoute extends Route {
  async model(params) {
    let response = await fetch(`/api/rentals/${params.rental_id}.json`);
    let { data } = await response.json();

    let { id, attributes } = data;
    let type;

    if (COMMUNITY_CATEGORIES.includes(attributes.category)) {
      type = 'Community';
    } else {
      type = 'Standalone';
    }

    return { id, type, ...attributes };
  }
}
```

We'll notice that the model hook in our `RentalRoute` is *almost* the same as our `IndexRoute`. There is one major difference between these two routes, and we can see that difference reflected here.

Unlike the `IndexRoute`, we have a `params` object being passed into our model hook. This is because we need to fetch our data from the `/api/rentals/${id}.json` endpoint, *not* the `/api/rentals.json` endpoint we were previously using. We already know that the individual rental endpoints fetch a single rental object, rather than an array of them, and that the route uses a `/:rental_id` dynamic segment to figure out which rental object we're trying to fetch from the server.

But how does the dynamic segment actually get to the `fetch` function? Well, we have to pass it into the function. Conveniently, we have access to the value of the `/:rental_id` dynamic segment through the `params` object. This is why we have a `params` argument in our model hook here. It is being passed through to this hook, and we use the `params.rental_id` attribute to figure out what data we want to `fetch`.

Other than these minor differences though, the rest of the route is pretty much the same to what we had in our index route.

```run:command hidden=true cwd=super-rentals
git add app/routes/rental.js
```

## Displaying Model Details with a Component

Next, let's make a `<RentalDetailed>` component.

```run:command cwd=super-rentals
ember generate component rental/detailed
```

```run:command hidden=true cwd=super-rentals
ember test --path dist
git add app/components/rental/detailed.gjs
git add tests/integration/components/rental/detailed-test.gjs
```

```run:file:patch lang=gjs cwd=super-rentals filename=app/components/rental/detailed.gjs
@@ -1,3 +1,50 @@
+import Jumbo from 'super-rentals/components/jumbo';
+import RentalImage from 'super-rentals/components/rental/image';
+import Map from 'super-rentals/components/map';
+
 <template>
-  {{yield}}
+  <Jumbo>
+    <h2>{{@rental.title}}</h2>
+    <p>Nice find! This looks like a nice place to stay near {{@rental.city}}.</p>
+    <a href="#" target="_blank" rel="external nofollow noopener noreferrer" class="share button">
+      Share on Twitter
+    </a>
+  </Jumbo>
+
+  <article class="rental detailed">
+    <RentalImage
+      src={{@rental.image}}
+      alt="A picture of {{@rental.title}}"
+    />
+
+    <div class="details">
+      <h3>About {{@rental.title}}</h3>
+
+      <div class="detail owner">
+        <span>Owner:</span> {{@rental.owner}}
+      </div>
+      <div class="detail type">
+        <span>Type:</span> {{@rental.type}} – {{@rental.category}}
+      </div>
+      <div class="detail location">
+        <span>Location:</span> {{@rental.city}}
+      </div>
+      <div class="detail bedrooms">
+        <span>Number of bedrooms:</span> {{@rental.bedrooms}}
+      </div>
+      <div class="detail description">
+        <p>{{@rental.description}}</p>
+      </div>
+    </div>
+
+    <Map
+      @lat={{@rental.location.lat}}
+      @lng={{@rental.location.lng}}
+      @zoom="12"
+      @width="894"
+      @height="600"
+      alt="A map of {{@rental.title}}"
+      class="large"
+    />
+  </article>
 </template>
```

This component is similar to our `<Rental>` component, except for the following differences.

* It shows a banner with a share button at the top (Implementation to come later).
* It shows a bigger image by default, with some additional detailed information.
* It shows a bigger map.
* It shows a description.

## Sharing Common Setup Code Between Tests

Now that we have this template in place, we can add some tests for this new component of ours.

```run:file:patch lang=gjs cwd=super-rentals filename=tests/integration/components/rental/detailed-test.gjs
@@ -3,3 +3,10 @@ import { setupRenderingTest } from 'super-rentals/tests/helpers';
 import { render } from '@ember/test-helpers';
-import Detailed from 'super-rentals/components/rental/detailed';
+import { tracked } from '@glimmer/tracking';
+import RentalDetailed from 'super-rentals/components/rental/detailed';
+
+class State {
+  @tracked rental = {};
+}
+
+const state = new State();
 
@@ -8,20 +15,48 @@ module('Integration | Component | rental/detailed', function (hooks) {
 
-  test('it renders', async function (assert) {
-    // Updating values is achieved using autotracking, just like in app code. For example:
-    // class State { @tracked myProperty = 0; }; const state = new State();
-    // and update using state.myProperty = 1; await rerender();
-    // Handle any actions with function myAction(val) { ... };
+  hooks.beforeEach(function () {
+    state.rental = {
+      id: 'grand-old-mansion',
+      title: 'Grand Old Mansion',
+      owner: 'Veruca Salt',
+      city: 'San Francisco',
+      location: {
+        lat: 37.7749,
+        lng: -122.4194,
+      },
+      category: 'Estate',
+      type: 'Standalone',
+      bedrooms: 15,
+      image:
+        'https://upload.wikimedia.org/wikipedia/commons/c/cb/Crane_estate_(5).jpg',
+      description:
+        'This grand old mansion sits on over 100 acres of rolling hills and dense redwood forests.',
+    };
+  });
 
-    await render(<template><Detailed /></template>);
+  test('it renders a header with a share button', async function (assert) {
+    await render(<template>
+      <RentalDetailed @rental={{state.rental}} />
+    </template>);
 
-    assert.dom().hasText('');
+    assert.dom('.jumbo').exists();
+    assert.dom('.jumbo h2').containsText('Grand Old Mansion');
+    assert
+      .dom('.jumbo p')
+      .containsText('a nice place to stay near San Francisco');
+    assert.dom('.jumbo a.button').containsText('Share on Twitter');
+  });
 
-    // Template block usage:
+  test('it renders detailed information about a rental property', async function (assert) {
     await render(<template>
-      <Detailed>
-        template block text
-      </Detailed>
+      <RentalDetailed @rental={{state.rental}} />
     </template>);
 
-    assert.dom().hasText('template block text');
+    assert.dom('article').hasClass('rental');
+    assert.dom('article h3').containsText('About Grand Old Mansion');
+    assert.dom('article .detail.owner').containsText('Veruca Salt');
+    assert.dom('article .detail.type').containsText('Standalone – Estate');
+    assert.dom('article .detail.location').containsText('San Francisco');
+    assert.dom('article .detail.bedrooms').containsText('15');
+    assert.dom('article .image').exists();
+    assert.dom('article .map').exists();
   });
```

We can use the `beforeEach` hook to share some boilerplate code, which allows us to have two tests that each focus on a different, single aspect of the component. This feels similar to other tests that we've already written&mdash;hopefully it feels easy, too!

> Zoey says...
>
> As its name implies, the `beforeEach` hook runs *once* before each `test` function is executed. This hook is the ideal place to set up anything that might be needed by all test cases in the file. On the other hand, if you need to do any cleanup after your tests, there is an `afterEach` hook!

```run:command hidden=true cwd=super-rentals
ember test --path dist
git add app/components/rental/detailed.gjs
git add tests/integration/components/rental/detailed-test.gjs
```

```run:screenshot width=1024 height=768 retina=true filename=pass-2.png alt="Tests are passing as expected"
visit http://localhost:4200/tests?nocontainer&nolint&deterministic
wait  #qunit-banner.qunit-pass
```

## Adding a Route Template

Finally, let's add a `rental` template to actually *invoke* our `<RentalDetailed>` component, as well as adding an acceptance test for this new behavior in our app.

```run:file:create lang=handlebars cwd=super-rentals filename=app/templates/rental.gjs
import RentalDetailed from 'super-rentals/components/rental/detailed';

<template>
  <RentalDetailed @rental={{@model}} />
</template>
```

```run:file:patch lang=js cwd=super-rentals filename=tests/acceptance/super-rentals-test.js
@@ -21,2 +21,20 @@

+  test('viewing the details of a rental property', async function (assert) {
+    await visit('/');
+    assert.dom('.rental').exists({ count: 3 });
+
+    await click('.rental:first-of-type a');
+    assert.strictEqual(currentURL(), '/rentals/grand-old-mansion');
+  });
+
+  test('visiting /rentals/grand-old-mansion', async function (assert) {
+    await visit('/rentals/grand-old-mansion');
+
+    assert.strictEqual(currentURL(), '/rentals/grand-old-mansion');
+    assert.dom('nav').exists();
+    assert.dom('h1').containsText('SuperRentals');
+    assert.dom('h2').containsText('Grand Old Mansion');
+    assert.dom('.rental.detailed').exists();
+  });
+
   test('visiting /about', async function (assert) {
```

Now, when we visit `http://localhost:4200/rentals/grand-old-mansion`, this is what we see:

```run:screenshot width=1024 retina=true filename=grand-old-mansion.png alt="A dedicated page for the Grand Old Mansion"
visit http://localhost:4200/rentals/grand-old-mansion?deterministic
wait  .rental.detailed
```

And if we run our tests now...

```run:command hidden=true cwd=super-rentals
ember test --path dist
git add app/templates/rental.gjs
git add tests/acceptance/super-rentals-test.js
```

```run:screenshot width=1024 height=768 retina=true filename=pass-3.png alt="All tests passing!"
visit http://localhost:4200/tests?nocontainer&nolint&deterministic
wait  #qunit-banner.qunit-pass
```

...they all pass! Great work!

This page *looks* done, but we have a share button that doesn't actually work. We'll address this in the next chapter.

```run:server:stop
npm start
```

```run:checkpoint cwd=super-rentals
Chapter 9
```
