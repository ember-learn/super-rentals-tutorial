```run:server:start hidden=true cwd=super-rentals expect="Serving on http://localhost:4200/"
ember server
```

Now that we are fetching real data from our "server", let's add a new feature — dedicated pages for each of our rentals:

<!-- TODO: add screen shot of the end state -->

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

Notice that we are doing something a little different here. Instead of using the default path (`/rental`), we're specifying a custom path. Not only are we using a custom path, but we're also passing in a `:rental_id`, which is what we call a *[dynamic segment][TODO: link to dynamic segment]*. When these routes are evaluated, the `rental_id` will be substituted with the `id` of the individual rental property that we are trying to navigate to.

```run:command hidden=true cwd=super-rentals
git add app/router.js
```

## Links with Dynamic Segments

Now that we have this route in place, we can update our `<Rental>` component to actually _link_ to each of our detailed rental properties!

```run:file:patch lang=js cwd=super-rentals filename=app/components/rental.hbs
@@ -6,3 +6,7 @@
   <div class="details">
-    <h3>{{@rental.title}}</h3>
+    <h3>
+      <LinkTo @route="rental" @model={{@rental}}>
+        {{@rental.title}}
+      </LinkTo>
+    </h3>
     <div class="detail owner">
```

Since we know that we're linking to the `rental` route that we just created, we also know that this route requires a dynamic segment. Thus, we need to pass in a `@model` argument so that the `<LinkTo>` component can generate the appropriate URL for that model.

```run:command hidden=true cwd=super-rentals
git add app/components/rental.hbs
```

Let's see this in action. If we go back to our browser and refresh the page, we should see our links, and they should all link to the correct URLs.

```run:screenshot width=1024 retina=true filename=broken-links.png alt="Broken links"
visit http://localhost:4200/
```

Wait a second &mdash; we have links, but they are all pointing to `/rentals/undefined`. Yikes! This is because `<LinkTo>` tries to use the `id` property from our model in order to replace the dynamic segment and generate the URL.

So what's the problem here? Well, our model doesn't actually have an `id` property! So _of course_ the `<LinkTo>` component isn't going to be able to find it and use it to generate the URL. Oops!

Thankfully, we can fix this pretty easily. As it turns out, the data that is returned by our server &mdash; the JSON data that lives in our `public/api` folder &mdash; actually does have an `id` attribute on it. We can double check this by going to `http://localhost:4200/api/rentals.json`.

```run:screenshot width=1024 height=512 retina=true filename=data.png alt="Our data do have an id attribute"
visit http://localhost:4200/api/rentals.json
```

If we look at the JSON data here, we can see that the `id` is included right alongside the `attributes` key. So we have access to this data; the only trouble is that we're not including it in our model! Let's change our model hook in the `index` route so that it includes the `id`.

```run:file:patch lang=js cwd=super-rentals filename=app/routes/index.js
@@ -14,3 +14,3 @@
     return data.map(model => {
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

```run:file:patch lang=js cwd=super-rentals filename=tests/integration/components/rental-test.js
@@ -11,2 +11,3 @@
       rental: {
+        id: 'grand-old-mansion',
         title: 'Grand Old Mansion',
@@ -30,2 +31,3 @@
     assert.dom('article h3').hasText('Grand Old Mansion');
+    assert.dom('article h3 a').hasAttribute('href', '/rentals/grand-old-mansion');
     assert.dom('article .detail.owner').includesText('Veruca Salt');
```

```run:command hidden=true cwd=super-rentals
git add tests/integration/components/rental-test.js
```

If we run the tests in the browser, everything should...

```run:screenshot width=1024 height=768 retina=true filename=fail.png alt="The test failed"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-fail
```

...wait a minute, our tests didn't pass!

Well, it's about time that we ran into something that didn't Just Work™ on the first try! This is the *advanced* part of the tutorial after all. 😉 

Component tests (like the one we have here) do not set up the router by default, because it's usually not necessary. In this specific case, however, we have a `<LinkTo>` in our component that is relying on the router to generate its URLs.

In this situation, we essentially need to _specifically_ opt-in to explicitly use our router in our component test. We can do this by calling `setupRouter()` in our `beforeEach` hook, which will set up the router before each test.

```run:file:patch lang=js cwd=super-rentals filename=tests/integration/components/rental-test.js
@@ -8,2 +8,6 @@

+  hooks.beforeEach(function() {
+    this.owner.setupRouter();
+  });
+
   test('it renders information about a rental property', async function(assert) {
```

> Zoey says...
>
> As its name implies, the `beforeEach` hook runs _once_ before each `test` function is executed. This hook is the ideal place to set up anything that might be needed by all test cases in the file. On the other hand, if you need to do any cleanup after your tests, there is an `afterEach` hook!

Setting up our router before each test function is executed will allow us to properly test that the URLs generated by `<LinkTo>` are exactly what we expect them to be.

```run:command hidden=true cwd=super-rentals
yarn test
git add tests/integration/components/rental-test.js
```

```run:screenshot width=1024 height=768 retina=true filename=pass.png alt="Tests are passing after our modifications"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

## Accessing Parameters from Dynamic Segments

Awesome! We're making such great progress.

Now that we have our `rental` route, let's finish up our `rental` page. The first step to doing this is making our route actually _do_ something. We added the route, but we haven't actually implemented it. So let's do that first by creating the route file.

```run:file:create lang=js cwd=super-rentals filename=app/routes/rental.js
import Route from '@ember/routing/route';

const COMMUNITY_CATEGORIES = [
  'Condo',
  'Townhouse',
  'Apartment'
];

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

We'll notice that the model hook in our `RentalRoute` is _almost_ the same as our `IndexRoute`. There is one major difference between these two routes, and we can see that difference reflected here.

Unlike the `IndexRoute`, we have a `params` object being passed into our model hook. This is because we need to fetch our data from the `/api/rentals/${id}.json` endpoint, _not_ the `/api/rentals.json` endpoint we were previously using. We already know that the individual rental endpoints fetch a single rental object, rather than an array of them, and that the route uses a `/:rental_id` dynamic segment to figure out which rental object we're trying to fetch from the server.

But how does the dynamic segment actually get to the `fetch` function? Well, we have to pass it into the function. Conveniently, we have access to the value of the `/:rental_id` dynamic segment through the `params` object. This is why we have a `params` argument in our model hook here. It is being passed through to this hook, and we use the `params.rental_id` attribute to figure out what data we want to `fetch`.

Other than these minor differences though, the rest of the route is pretty much the same to what we had in our index route.

```run:command hidden=true cwd=super-rentals
git add app/routes/rental.js
```

## Displaying Model Details with a Component

Next, let's make a `<Rental::Detailed>` component.

```run:command cwd=super-rentals
ember generate component rental/detailed
```

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/rental/detailed.hbs
git add tests/integration/components/rental/detailed-test.js
```

```run:file:patch lang=handlebars cwd=super-rentals filename=app/components/rental/detailed.hbs
@@ -1 +1,44 @@
-{{yield}}
\ No newline at end of file
+<Jumbo>
+  <h2>{{@rental.title}}</h2>
+  <p>Nice find! This looks like a nice place to stay near {{@rental.city}}.</p>
+  <a href="#" target="_blank" rel="external,nofollow,noopener,noreferrer" class="share button">
+    Share on Twitter
+  </a>
+</Jumbo>
+
+<article class="rental detailed">
+  <Rental::Image
+    src={{@rental.image}}
+    alt="A picture of {{@rental.title}}"
+  />
+
+  <div class="details">
+    <h3>About {{@rental.title}}</h3>
+
+    <div class="detail owner">
+      <span>Owner:</span> {{@rental.owner}}
+    </div>
+    <div class="detail type">
+      <span>Type:</span> {{@rental.type}} – {{@rental.category}}
+    </div>
+    <div class="detail location">
+      <span>Location:</span> {{@rental.city}}
+    </div>
+    <div class="detail bedrooms">
+      <span>Number of bedrooms:</span> {{@rental.bedrooms}}
+    </div>
+    <div class="detail description">
+      <p>{{@rental.description}}</p>
+    </div>
+  </div>
+
+  <Map
+    @lat={{@rental.location.lat}}
+    @lng={{@rental.location.lng}}
+    @zoom="12"
+    @width="894"
+    @height="600"
+    alt="A map of {{@rental.title}}"
+    class="large"
+  />
+</article>
```

This component is similar to our `<Rental>` component, except for the following differences.

* It shows a banner with a share button at the top (Implementation to come later).
* It shows a bigger image by default, with some additional detailed information.
* It shows a bigger map.
* It shows a description.

## Sharing Common Setup Code Between Tests

Now that we have this template in place, we can add some tests for this new component of ours.

```run:file:patch lang=handlebars cwd=super-rentals filename=tests/integration/components/rental/detailed-test.js
@@ -8,18 +8,42 @@

-  test('it renders', async function(assert) {
-    // Set any properties with this.set('myProperty', 'value');
-    // Handle any actions with this.set('myAction', function(val) { ... });
+  hooks.beforeEach(function() {
+    this.setProperties({
+      rental: {
+        id: 'grand-old-mansion',
+        title: 'Grand Old Mansion',
+        owner: 'Veruca Salt',
+        city: 'San Francisco',
+        location: {
+          lat: 37.7749,
+          lng: -122.4194,
+        },
+        category: 'Estate',
+        type: 'Standalone',
+        bedrooms: 15,
+        image: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Crane_estate_(5).jpg',
+        description: 'This grand old mansion sits on over 100 acres of rolling hills and dense redwood forests.',
+      }
+    });
+  });

-    await render(hbs`<Rental::Detailed />`);
+  test('it renders a header with a share button', async function(assert) {
+    await render(hbs`<Rental::Detailed @rental={{this.rental}} />`);

-    assert.equal(this.element.textContent.trim(), '');
+    assert.dom('.jumbo').exists();
+    assert.dom('.jumbo h2').containsText('Grand Old Mansion');
+    assert.dom('.jumbo p').containsText('a nice place to stay near San Francisco');
+    assert.dom('.jumbo a.button').containsText('Share on Twitter');
+  });

-    // Template block usage:
-    await render(hbs`
-      <Rental::Detailed>
-        template block text
-      </Rental::Detailed>
-    `);
+  test('it renders detailed information about a rental property', async function(assert) {
+    await render(hbs`<Rental::Detailed @rental={{this.rental}} />`);

-    assert.equal(this.element.textContent.trim(), 'template block text');
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

We can again use the `beforeEach` hook that we learned about earlier, which allows us to have two tests that each focus on a different, single aspect of the component, while also sharing some boilerplate code! This feels similar to other tests that we've already written &mdash; hopefully it feels easy, too!

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/rental/detailed.hbs
git add tests/integration/components/rental/detailed-test.js
```

```run:screenshot width=1024 height=768 retina=true filename=pass-2.png alt="Tests are passing as expected"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

## Adding a Route Template

Finally, let's add a `rental` template to actually _invoke_ our `<Rental::Detailed>` component, as well as adding an acceptance test for this new behavior in our app.

```run:file:create lang=handlebars cwd=super-rentals filename=app/templates/rental.hbs
<Rental::Detailed @rental={{@model}} />
```

```run:file:patch lang=js cwd=super-rentals filename=tests/acceptance/super-rentals-test.js
@@ -21,2 +21,20 @@

+  test('viewing the details of a rental property', async function(assert) {
+    await visit('/');
+    assert.dom('.rental').exists({ count: 3 });
+
+    await click('.rental:first-of-type a');
+    assert.equal(currentURL(), '/rentals/grand-old-mansion');
+  });
+
+  test('visiting /rentals/grand-old-mansion', async function(assert) {
+    await visit('/rentals/grand-old-mansion');
+
+    assert.equal(currentURL(), '/rentals/grand-old-mansion');
+    assert.dom('nav').exists();
+    assert.dom('h1').containsText('SuperRentals');
+    assert.dom('h2').containsText('Grand Old Mansion');
+    assert.dom('.rental.detailed').exists();
+  });
+
   test('visiting /about', async function(assert) {
```

Now, when we visit `http://localhost:4200/rentals/grand-old-mansion`, this is what we see:

```run:screenshot width=1024 retina=true filename=grand-old-mansion.png alt="A dedicated page for the Grand Old Mansion"
visit http://localhost:4200/rentals/grand-old-mansion
wait  .rental.detailed
```

And if we run our tests now...

```run:command hidden=true cwd=super-rentals
yarn test
git add app/templates/rental.hbs
git add tests/acceptance/super-rentals-test.js
```

```run:screenshot width=1024 height=768 retina=true filename=pass-3.png alt="All tests passing!"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

...they all pass! Great work!

This page _looks_ done, but we have a share button that doesn't actually work. We'll address this in the next chapter. 

```run:server:stop
ember server
```

```run:checkpoint cwd=super-rentals
Chapter 11
```
