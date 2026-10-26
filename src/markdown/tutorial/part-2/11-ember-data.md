<!--lint disable no-undefined-references-->

```run:server:start hidden=true cwd=super-rentals expect="Local:   http://localhost:4200/"
npm start
```

In this chapter, we will work on removing some code duplication in our route handlers, by switching to using EmberData to manage our data. The end result looks exactly the same as before:

![The Super Rentals app by the end of the chapter](/images/tutorial/part-2/ember-data/homepage@2x.png)

During this refactor, you will learn about:

* WarpDrive schemas and derived fields
* Testing schemas
* Loading records in routes
* The EmberData Store and RequestManager
* Working with Request builders and handlers

## What is EmberData?

Now that we've added some features, it's time to do some clean up again!

A while back, we added the `rental` route. If memory serves us well, we didn't do anything too fancy when we added that new route; we just copy-pasted a lot of the same logic from the `index` route.

```run:file:show lang=js cwd=super-rentals filename=app/routes/index.js
```

```run:file:show lang=js cwd=super-rentals filename=app/routes/rental.js
```

This duplication incurred a bit of *[technical debt][TODO: link to technical debt]* for us, making our code base harder to maintain in the long run. For example, if we wanted to change something about how our data-fetching logic worked, we'd have to change it in *both* the `index` and `rental` routes. If we changed things in one place, but forgot about the other spot, we could end up with really subtle bugs in our app! Yikes!

Chances are, as we keep working on this app, we will need to add more routes that fetch data from the server. Since all of our server's API endpoints follow the [JSON:API](https://jsonapi.org/) format, we'd have to keep copying this boilerplate for every single new route we add to the app!

Fortunately, we're not going to do any of that. As it turns out, there's a much better solution here: we can use EmberData! As its name implies, [EmberData](../../../models/) is a library that helps manage data and *[application state][TODO: link to application state]* in Ember applications.


> Zoey says...
>
> EmberData is in the process of being renamed to WarpDrive. It's not just changing its name though, WarpDrive is now able to be used in multiple different frameworks. You can read more about it in the [WarpDrive Docs](https://warp-drive.io)

There's a lot to learn about EmberData, but let's start by uncovering features that help with our immediate problem.

## WarpDrive Schemas

EmberData is built around the idea of organizing your app's data into *records*. Each record has a *type*, and a *[schema](https://warp-drive.io/guides/the-manual/schemas/)* that describes the fields of that type. Records represent units of information that our application presents to the user. For example, the rental property data we have been working with would be a good candidate.

Enough talking, why don't we give that a try!

```run:file:create lang=js cwd=super-rentals filename=app/schemas/rental.js
import { withDefaults } from '@warp-drive/core/reactive';
import { Type } from '@warp-drive/core/types/symbols';

const COMMUNITY_CATEGORIES = ['Condo', 'Townhouse', 'Apartment'];

export const RentalSchema = withDefaults({
  type: 'rental',
  fields: [
    { kind: 'field', name: 'title' },
    { kind: 'field', name: 'owner' },
    { kind: 'field', name: 'city' },
    { kind: 'field', name: 'location' },
    { kind: 'field', name: 'category' },
    { kind: 'field', name: 'image' },
    { kind: 'field', name: 'bedrooms' },
    { kind: 'field', name: 'description' },
    { kind: 'derived', name: 'type', type: 'rental-type' },
  ],
});

export function rentalType(rental) {
  if (COMMUNITY_CATEGORIES.includes(rental.category)) {
    return 'Community';
  } else {
    return 'Standalone';
  }
}
rentalType[Type] = 'rental-type';
```

Here, we created a `RentalSchema` for the `rental` type. A schema is plain data: it lists the fields, but it does not contain any code. The `withDefaults` function adds the settings that most schemas need, such as the `id` field. When fetching the listing data from the server, each individual rental property will be represented by a *[record](../../../models/finding-records/)* that follows this schema.

We used `field` entries to declare the attributes of a rental property. These attributes correspond directly to the `attributes` data we expect the server to provide in its responses:

```run:file:show lang=json cwd=super-rentals filename=public/api/rentals/grand-old-mansion.json
```

We can access these attributes on a rental record using standard dot notation, such as `rental.title` or `rental.location.lat`. In addition to the fields we declared here, there will always be an *id* field as well, which is used to uniquely identify the record and can be accessed using `rental.id`.

Since a schema does not contain code, we cannot add a getter to it the way we would with a class. Instead, we declared `type` as a `derived` field. When we read `rental.type`, EmberData calls the `rentalType` *[derivation](https://warp-drive.io/guides/the-manual/schemas/derivations)* function with the record and returns its result. We took advantage of this feature to move our `type` logic (which is a major source of unnecessary duplication in our route handlers) into one place. Once we have everything working here, we will go back to clean that up.

The line `rentalType[Type] = 'rental-type';` gives our derivation a name. The derived field uses that name, in its `type: 'rental-type'` option, to find the function.

Fields on a record work with the auto-track feature (which we learned about [in a previous chapter](../../part-1/reusable-components/)). Therefore, our derivation is free to read `rental.category`, and Ember will know when to compute `type` again.

## The Store Service

EmberData provides a `store` *[service](../../../services/)*, also known as the EmberData store. The store needs to know about our schema and our derivation before it can create rental records. The default blueprint generated an `app/services/store.js` file for us. Let's replace its contents:

```run:file:create lang=js cwd=super-rentals filename=app/services/store.js
import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';
import { RentalSchema, rentalType } from 'super-rentals/schemas/rental';

const Store = useRecommendedStore({
  cache: JSONAPICache,
  handlers: [
    // -- your handlers here
  ],
  schemas: [RentalSchema],
  derivations: [rentalType],
});

export default Store;
```

The `useRecommendedStore` function creates a store class with the recommended defaults. The `cache` option tells the store how to cache the responses from our server, which use the [JSON:API](https://jsonapi.org/) format. The `schemas` and `derivations` options register our rental schema and the derivation that it uses.

```run:command hidden=true cwd=super-rentals
# Blueprints before ember-cli/ember-app-blueprint#338 install the legacy package.
if grep -q '"@warp-drive/legacy"' package.json; then pnpm remove @warp-drive/legacy; fi
pnpm test
git add app/schemas/rental.js
git add app/services/store.js
git add package.json
```

## Testing Schemas

So far, we haven't had a good place to write tests for the rental property's `type` logic. Now that we have found a home for it in our schema, it is easy to test this behavior. Let's create a test file for it:

```run:file:create lang=js cwd=super-rentals filename=tests/unit/schemas/rental-test.js
import { setupTest } from 'super-rentals/tests/helpers';
import { module, test } from 'qunit';

module('Unit | Schema | rental', function (hooks) {
  setupTest(hooks);

  test('it has the right type', function (assert) {
    const store = this.owner.lookup('service:store');
    let rental = store.createRecord('rental', {
      id: 'grand-old-mansion',
      title: 'Grand Old Mansion',
      owner: 'Veruca Salt',
      city: 'San Francisco',
      location: {
        lat: 37.7749,
        lng: -122.4194,
      },
      category: 'Estate',
      bedrooms: 15,
      image:
        'https://upload.wikimedia.org/wikipedia/commons/c/cb/Crane_estate_(5).jpg',
      description:
        'This grand old mansion sits on over 100 acres of rolling hills and dense redwood forests.',
    });

    assert.strictEqual(rental.type, 'Standalone');

    rental.category = 'Condo';
    assert.strictEqual(rental.type, 'Community');

    rental.category = 'Townhouse';
    assert.strictEqual(rental.type, 'Community');

    rental.category = 'Apartment';
    assert.strictEqual(rental.type, 'Community');

    rental.category = 'Estate';
    assert.strictEqual(rental.type, 'Standalone');
  });
});
```

This test is also known as a *[unit test](../../../testing/testing-models/)*. Unlike any of the other tests that we've written thus far, this test doesn't actually *render* anything. It just creates a rental record and tests the record directly, changing its fields and asserting the value of `type`.

In our test, we used the `this.owner.lookup('service:store')` API to get access to the EmberData store. The store provides a `createRecord` method to create a new record for us. We can change the fields of a record that we created this way. Records that the store loads from the server cannot be changed directly, which keeps them the same as the data on the server.

Running the tests in the browser confirms that everything is working as intended:

```run:command hidden=true cwd=super-rentals
pnpm test
git add tests/unit/schemas/rental-test.js
```

```run:screenshot width=1024 height=1024 retina=true filename=pass-1.png alt="All the tests pass!"
visit http://localhost:4200/tests?nocontainer&nolint&deterministic
wait  #qunit-banner.qunit-pass
```

## Loading Records in Routes

Alright, now that we have our schema set up, it's time to refactor our route handlers to use EmberData and remove the duplication!

```run:file:patch lang=js cwd=super-rentals filename=app/routes/index.js
@@ -1,22 +1,11 @@
 import Route from '@ember/routing/route';
-
-const COMMUNITY_CATEGORIES = ['Condo', 'Townhouse', 'Apartment'];
+import { service } from '@ember/service';
+import { query } from '@warp-drive/utilities/json-api';

 export default class IndexRoute extends Route {
-  async model() {
-    let response = await fetch('/api/rentals.json');
-    let { data } = await response.json();
-
-    return data.map((model) => {
-      let { id, attributes } = model;
-      let type;
+  @service store;

-      if (COMMUNITY_CATEGORIES.includes(attributes.category)) {
-        type = 'Community';
-      } else {
-        type = 'Standalone';
-      }
-
-      return { id, type, ...attributes };
-    });
+  async model() {
+    const { content } = await this.store.request(query('rental'));
+    return content.data;
   }
```

```run:file:patch lang=js cwd=super-rentals filename=app/routes/rental.js
@@ -1,20 +1,13 @@
 import Route from '@ember/routing/route';
-
-const COMMUNITY_CATEGORIES = ['Condo', 'Townhouse', 'Apartment'];
+import { service } from '@ember/service';
+import { findRecord } from '@warp-drive/utilities/json-api';

 export default class RentalRoute extends Route {
-  async model(params) {
-    let response = await fetch(`/api/rentals/${params.rental_id}.json`);
-    let { data } = await response.json();
-
-    let { id, attributes } = data;
-    let type;
+  @service store;

-    if (COMMUNITY_CATEGORIES.includes(attributes.category)) {
-      type = 'Community';
-    } else {
-      type = 'Standalone';
-    }
-
-    return { id, type, ...attributes };
+  async model(params) {
+    const { content } = await this.store.request(
+      findRecord('rental', params.rental_id),
+    );
+    return content.data;
   }
```

Wow... that removed a lot of code! This is all possible thanks to the power of conventions!

## The EmberData Store

As mentioned above, EmberData provides a `store` service, which we can inject into our route using the `@service store;` declaration, making the EmberData store available as `this.store`. It provides the `request` method for making fetch requests using `RequestManager`. As its name implies: the `RequestManager` is request centric. Instead of answering questions about specific records or types of records, we ask it about the status of a specific request. To initiate a request, we use the `request` method on the store, passing in a request object. The request object is created using builders from `@warp-drive/utilities/json-api`. Specifically, the [`findRecord` builder](../../../models/finding-records/#toc_retrieving-a-single-record) takes a type (`rental` in our case) and an ID (for us, that would be `params.rental_id` from the URL) as arguments and builds fetch options for a single record. On the other hand, the [`query` builder](../../../models/finding-records/#toc_retrieving-multiple-records) takes the type as an argument and builds fetch options to query for all records of that type.

EmberData can do many things, and in the default setup it provides caching. EmberData's store caches server responses, allowing instant access to previously fetched data. If the data is already cached, you don't need to wait for the server to respond again. If not, the store fetches it for you.

That's a lot of theory, but is this going to work in our app? Let's run the tests and find out!

```run:screenshot width=1024 height=960 retina=true filename=fail-1.png alt="A few tests failed!"
visit http://localhost:4200/tests?nocontainer&nolint&deterministic
wait  #qunit-banner.qunit-fail
```

Darn, there were a couple of failing tests! At the same time, it's great that we were made aware of the potential problems – yay, regression tests!

Looking at the failure messages, the problem appears to be that the store went to the wrong URLs when fetching data from the server, resulting in some 404 errors. Specifically:

* When building the `query('rental')` request, the resulted `url` in request options was `/rentals`, instead of `/api/rentals.json`.
* When building the `findRecord('rental', 'grand-old-mansion')` request, the resulted `url` in request options was `/rentals/grand-old-mansion`, instead of `/api/rentals/grand-old-mansion.json`.

Hm, okay, so we have to teach EmberData to fetch data from the correct location. But how does EmberData know how to fetch data from our server in the first place?

## Working with Request builders and Handlers

Let's start customizing the things that didn't work for us by default. Specifically:

* Our resource URLs have an extra `/api` *namespace* prefix.
* Our resource URLs have a `.json` extension at the end.

The first thing we want to do is have our builder respect a configurable default host and/or namespace. Adding a namespace prefix happens to be pretty common across Ember apps, so EmberData provides a global config mechanism for host and namespace. Typically you will want to do this either in your store file or app file.

```run:file:patch lang=js cwd=super-rentals filename=app/app.js
@@ -7,0 +8,5 @@ import setupInspector from '@embroider/legacy-inspector-support/ember-source-4.1
+import { setBuildURLConfig } from '@warp-drive/utilities/json-api';
+
+setBuildURLConfig({
+  namespace: 'api',
+});
```

Adding the `.json` extension is a bit less common, and doesn't have a declarative configuration API of its own. We could just modify request options directly in place of use, but that would be a bit messy. Instead, let's create a handler to do this for us.

```run:file:create lang=js cwd=super-rentals filename=app/utils/handlers.js
export const JsonSuffixHandler = {
  request(context, next) {
    const { request } = context;
    const updatedRequest = Object.assign({}, request, {
      url: request.url + '.json',
    });

    return next(updatedRequest);
  },
};
```

As you can see, the handler appends `.json` to the URL of each request. Pretty simple, right? Then it calls the `next` function with the modified copy of the request object (because it is immutable). This is how we can chain multiple handlers together to build up a request.

The next step that we need to do, is to configure our store to use this handler. Let's update the store service to add this handler:

```run:file:patch lang=js cwd=super-rentals filename=app/services/store.js
@@ -3,2 +3,3 @@ import { JSONAPICache } from '@warp-drive/json-api';
 import { RentalSchema, rentalType } from 'super-rentals/schemas/rental';
+import { JsonSuffixHandler } from 'super-rentals/utils/handlers';
 
@@ -8,2 +9,3 @@ const Store = useRecommendedStore({
     // -- your handlers here
+    JsonSuffixHandler
   ],
```

With our new EmberData configuration in place, all our tests should pass again.

```run:command hidden=true cwd=super-rentals
pnpm test
git add app/app.js
git add app/routes/index.js
git add app/routes/rental.js
git add app/services/store.js
git add app/utils/handlers.js
```

```run:screenshot width=1024 height=1024 retina=true filename=pass-2.png alt="Once again, all the tests are passing again!"
visit http://localhost:4200/tests?nocontainer&nolint&deterministic
wait  #qunit-banner.qunit-pass
```

The UI works exactly the same as before as well, just with much less code!

```run:screenshot width=1024 retina=true filename=homepage.png alt="The homepage works exactly the same as before, but with much less code!"
visit http://localhost:4200/?deterministic
wait  .rentals li:nth-of-type(3) article.rental
```

```run:screenshot width=1024 retina=true filename=detailed.png alt="The details page works exactly the same as before, but with much less code!"
visit http://localhost:4200/rentals/grand-old-mansion?deterministic
wait  .rental.detailed
```

EmberData offers many, many features (like managing the *relationships* between different types of records) and there's a lot more we can learn about it. For example, if your backend's have some inconsistencies across different endpoints, EmberData allows you to define request specific handlers and builders! We are just scratching the surface here. If you want to learn more about EmberData, check out [its own dedicated section](../../../models/) in the guides!

```run:server:stop
npm start
```

```run:checkpoint cwd=super-rentals
Chapter 11
```
