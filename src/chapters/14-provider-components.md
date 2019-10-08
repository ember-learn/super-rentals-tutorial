```run:server:start hidden=true cwd=super-rentals expect="Serving on http://localhost:4200/"
ember server
```

In this chapter, ... The end result looks like this:

<!-- TODO: add screen shot of the end state -->

During this refactor, you will learn about:

* ...
* ...
* ...

## Add input

* We want to add a search...

```run:file:patch lang=handlebars cwd=super-rentals filename=app/templates/index.hbs
@@ -7,2 +7,7 @@
 <div class="rentals">
+  <label>
+    <span>Where would you like to stay?</span>
+    <input class="light">
+  </label>
+
   <ul class="results">
```

* The UI looks like this

```run:command hidden=true cwd=super-rentals
yarn test
git add app/templates/index.hbs
```

```run:screenshot width=1024 retina=true filename=homepage-with-inert-search.png alt="The homepage with a search box, but it doesn't work yet."
visit http://localhost:4200/
wait  .rentals input
```

* This looks great, but it doesn't do anything.

## Refactor index tempalte into component

* In order to wire up the search box, we need a place to store some state.
* Namely, we want to store the search query entered by the user somewhere.
* Since we are in a route tempalte, there is no place to store the state.
* We'll refactor our index template into a rentals component.
* Start with the template.

```run:file:create lang=handlebars cwd=super-rentals filename=app/components/rentals.hbs
<div class="rentals">
  <label>
    <span>Where would you like to stay?</span>
    <input class="light">
  </label>

  <ul class="results">
    {{#each @rentals as |rental|}}
      <li><Rental @rental={{rental}} /></li>
    {{/each}}
  </ul>
</div>
```

* Basically just copy and paste.
* While extracting the component, we renamed the `@model` argument into `@rentals`, to be a little more specific.
* Let's write a test for this component:

```run:file:create lang=js cwd=super-rentals filename=tests/integration/components/rentals-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | rentals', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders all given rental properties by default', async function(assert) {
    this.setProperties({
      rentals: [{
        id: 'grand-old-mansion',
        title: 'Grand Old Mansion',
        owner: 'Veruca Salt',
        city: 'San Francisco',
        location: {
          lat: 37.7749,
          lng: -122.4194
        },
        category: 'Estate',
        type: 'Standalone',
        bedrooms: 15,
        image: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Crane_estate_(5).jpg',
        description: 'This grand old mansion sits on over 100 acres of rolling hills and dense redwood forests.'
      },
      {
        id: 'urban-living',
        title: 'Urban Living',
        owner: 'Mike Teavee',
        city: 'Seattle',
        location: {
          lat: 47.6062,
          lng: -122.3321
        },
        category: 'Condo',
        type: 'Community',
        bedrooms: 1,
        image: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Alfonso_13_Highrise_Tegucigalpa.jpg',
        description: 'A commuters dream. This rental is within walking distance of 2 bus stops and the Metro.'
      },
      {
        id: 'downtown-charm',
        title: 'Downtown Charm',
        owner: 'Violet Beauregarde',
        city: 'Portland',
        location: {
          lat: 45.5175,
          lng: -122.6801
        },
        category: 'Apartment',
        type: 'Community',
        bedrooms: 3,
        image: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Wheeldon_Apartment_Building_-_Portland_Oregon.jpg',
        description: 'Convenience is at your doorstep with this charming downtown rental. Great restaurants and active night life are within a few feet.'
      }]
    });

    await render(hbs`<Rentals @rentals={{this.rentals}} />`);

    assert.dom('.rentals').exists();
    assert.dom('.rentals input').exists();

    assert.dom('.rentals .results').exists();
    assert.dom('.rentals .results li').exists({ count: 3 });

    assert.dom('.rentals .results li:nth-of-type(1)').containsText('Grand Old Mansion');
    assert.dom('.rentals .results li:nth-of-type(2)').containsText('Urban Living');
    assert.dom('.rentals .results li:nth-of-type(3)').containsText('Downtown Charm');
  });
});
```

* Finally, we can put all of these together by changing our index template to using our new `<Rentals>` component.

```run:file:patch lang=handlebars cwd=super-rentals filename=app/templates/index.hbs
@@ -6,13 +6,2 @@

-<div class="rentals">
-  <label>
-    <span>Where would you like to stay?</span>
-    <input class="light">
-  </label>
-
-  <ul class="results">
-    {{#each @model as |rental|}}
-      <li><Rental @rental={{rental}} /></li>
-    {{/each}}
-  </ul>
-</div>
+<Rentals @rentals={{@model}} />
```

* We pass the `@model` argument into the `<Rentals>` component as `@rentals`.

* Run your tests, they should still pass after this change.

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/rentals.hbs
git add app/templates/index.hbs
git add tests/integration/components/rentals-test.js
```

```run:screenshot width=1024 height=1024 retina=true filename=pass-1.png alt="The new test is passing."
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

* The UI looks the same as before

```run:screenshot width=1024 retina=true filename=homepage-with-rentals-component.png alt="The homepage looks exactly the same as before!"
visit http://localhost:4200/
wait  .rentals input
```

## Add <Input>

* Now that we have a component, we can wire up the search box.

* First, we will add a component class to store our state:

```run:file:create lang=js cwd=super-rentals filename=app/components/rentals.js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class RentalsComponent extends Component {
  @tracked query = '';
}
```

* Next, we will wire it up in the template.

```run:file:patch lang=handlebars cwd=super-rentals filename=app/components/rentals.hbs
@@ -3,3 +3,3 @@
     <span>Where would you like to stay?</span>
-    <input class="light">
+    <Input @value={{this.query}} class="light" />
   </label>
```

* Ember provides an `<Input>` component that is a wrapper around the `<input>` element.
* The `<Input>` component will wire things up such that `this.query` is kept in-sync with what the user had typed.
* Maybe Zoey says: if you want to see that in action, you can add `<p>{{this.query}}</p>` to the component template and watch it update live as you type!

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/rentals.hbs
git add app/components/rentals.js
```

## Add <Rentals::Filter>

* Now that we have the query wired up, let's make it filter the results based on this query.
* We will make another component for this. We will call it `<Rentals::Filter>`.

```run:file:create lang=js cwd=super-rentals filename=app/components/rentals/filter.js
import Component from '@glimmer/component';

export default class RentalsFilterComponent extends Component {
  get results() {
    let { rentals, query } = this.args;

    if (query) {
      rentals = rentals.filter(rental => rental.title.includes(query));
    }

    return rentals;
  }
}
```

```run:file:create lang=handlebars cwd=super-rentals filename=app/components/rentals/filter.hbs
{{yield this.results}}
```

* In the component class, we made a getter to do the work of filtering through our rentals based on the `@rentals` and `@query` arguments.
* In the component template, we did not actually rendering anything. Instead, all we have is a `{{yield}}`, which [we have seen before](../04-component-basics/).
* But in this case, we also have `this.results` inside of our `{{yield}}`. What does that do?
* As you know, the purpose of `{{yield}}` is to render the *block* that is passed in by whatever is invoking the current component, also known as the component's *caller*. So let's take a look at how we would use this in the `<Rentals>` component.

```run:file:patch lang=handlebars cwd=super-rentals filename=app/components/rentals.hbs
@@ -7,5 +7,7 @@
   <ul class="results">
-    {{#each @rentals as |rental|}}
-      <li><Rental @rental={{rental}} /></li>
-    {{/each}}
+    <Rentals::Filter @rentals={{@rentals}} @query={{this.query}} as |results|>
+      {{#each results as |rental|}}
+        <li><Rental @rental={{rental}} /></li>
+      {{/each}}
+    </Rentals::Filter>
   </ul>
```

* For the most part, we're invoking `<Rentals::Filter>` similar to how we've invoked any other components. We're passing in some arguments, namely, `@rentals` and `@query`. We're also passing in a block, which is the content that is enclosed in between the component's opening and closing tags (`<Rentals::Filter>...</Rentals::Filter>`). Both of these we have seen before.
* However, the main difference is the use of `as |results|`, which goes hand-in-hand with the `{{yield this.results}}` syntax we saw earlier.

* We've already seen this feature before, when using `{{#each}}`. When we say `{{#each @items as |item|}}...{{/each}}`, we are passing a block (the `...`) to `{{#each}}`. Ember will iterate the array we provided (`@items`) and render our block once per item in the array. Inside our block, we will want to access the current item *somehow*. The way that `{{#each}}` provides the item to our block, is through the `as |item|` declaration, which creates a local variable `item`, also known as a *block parameter*, that is only accessible inside the block. Ember will fill in this variable with the current item each time it calls our block.

* The need to provide some data to a block is not unique to `{{#each}}`. In our case, our `<Rentals::Filter>` component would like to take the unfiltered list of rental properties, match them against the user's query and then provide the filtered list of rental properties to its caller (which would be the `<Rentals>` component).

* As it turns out, this ability to provide data is not a superpower that's only available to built-in syntaxes, like `{{#each}}`! Ember allows us to pass arbitrary data to blocks by passing additional arguments to the `{{yield}}` keyword, which we did with `{{yield this.results}}` in `<Rentals::Filter>`.

* In `<Rentals>`, we used the `as |results|` syntax when invoking `<Rentals::Filter>`. Just like in `{{#each}}`, this block parameter syntax allows our block to access the yielded data using the local variable `results`. In this case, the yielded data came from `{{yield this.results}}`, which is the filtered list of rental properties.

* Note that the local variable name `results` is arbitrary and is not special in any way. We could have named it anything, from `as |data|`, `as |filtered|`, or we could even have named it after our pet. The important is that whatever name this block param is how we will access the yielded data inside our block.

* Interestingly, `<Rentals::Filter>` does not actually render any content in its template. Its only responsibility is to set up some piece of state (filtering the rental properties) and yield it back to its caller, in the form of a block parameter.

* Alright, that's a lot of theory, but does it work? Let's find out!

```run:screenshot width=1024 retina=true filename=filtered-results.png alt="Trying out the search box."
visit http://localhost:4200/
wait  .rentals input
type  .rentals input, Downtown
wait  .rental
```

* It worked!
* Let's write a test for this new behavior while we're at it.

```run:file:patch lang=js cwd=super-rentals filename=tests/integration/components/rentals-test.js
@@ -2,3 +2,3 @@
 import { setupRenderingTest } from 'ember-qunit';
-import { render } from '@ember/test-helpers';
+import { render, fillIn } from '@ember/test-helpers';
 import { hbs } from 'ember-cli-htmlbars';
@@ -8,3 +8,3 @@

-  test('it renders all given rental properties by default', async function(assert) {
+  hooks.beforeEach(function() {
     this.setProperties({
@@ -56,3 +56,5 @@
     });
+  });

+  test('it renders all given rental properties by default', async function(assert) {
     await render(hbs`<Rentals @rentals={{this.rentals}} />`);
@@ -69,2 +71,21 @@
   });
+
+  test('it updates the results according to the search query', async function(assert) {
+    await render(hbs`<Rentals @rentals={{this.rentals}} />`);
+
+    assert.dom('.rentals').exists();
+    assert.dom('.rentals input').exists();
+
+    await fillIn('.rentals input', 'Downtown');
+
+    assert.dom('.rentals .results').exists();
+    assert.dom('.rentals .results li').exists({ count: 1 });
+    assert.dom('.rentals .results li').containsText('Downtown Charm');
+
+    await fillIn('.rentals input', 'Mansion');
+
+    assert.dom('.rentals .results').exists();
+    assert.dom('.rentals .results li').exists({ count: 1 });
+    assert.dom('.rentals .results li').containsText('Grand Old Mansion');
+  });
 });
```

* Notice that we extracted our setup (`setProperties`) into the before hooks. Also added a new test that uses the `fillIn` test helper.

* Zoey Says... this search is not perfect. For example, it should be case-insensitive and it should also allow you to search by city, category, type, or description. See if you can improve on this.

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/rentals.hbs
git add app/components/rentals/filter.hbs
git add app/components/rentals/filter.js
git add tests/integration/components/rentals-test.js
```

```run:screenshot width=1024 height=1024 retina=true filename=pass-2.png alt="The new test is passing."
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

```run:server:stop
ember server
```

```run:checkpoint cwd=super-rentals
Chapter 14
```
