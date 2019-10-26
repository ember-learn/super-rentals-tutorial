<!--lint disable no-undefined-references-->

```run:server:start hidden=true cwd=super-rentals expect="Serving on http://localhost:4200/"
ember server
```

In this chapter, we'll work on adding a new search feature, and refactor our `index.hbs` template into a new component along the way. We'll learn about a new pattern for passing data around between components, too! Once we're done, our page will look like this:

<!-- TODO: add screen shot of the end state -->

During this refactor, you will learn about:

* Using Ember's built-in `<Input>` component
* The provider component pattern
* Using block parameters when invoking components
* Yielding data to caller components

## Add input

As our app grows and as we add more features to it, one thing that would be really nice to have is some search functionality. It would be great if our users could just type a word into a search box and our app could just respond with matching and relevant rentals. So how could we go about implementing this feature?

Well, we can start simple. Before we worry about implementing the "search" part of this feature, let's just get something on the page. The first step is to add an `<input>` tag to our `index` page, and make it look pretty with a class.

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

Now if we refresh the UI, it has an `<input>` element on the page.

```run:command hidden=true cwd=super-rentals
yarn test --path dist
git add app/templates/index.hbs
```

```run:screenshot width=1024 retina=true filename=homepage-with-inert-search.png alt="The homepage with a search box, but it doesn't work yet."
visit http://localhost:4200/
wait  .rentals input
```

Awesome, one step done. Now, this input looks great, but it doesn't actually *do* anything.

## Refactoring the index template into a component

In order to make our search box actually work, we are going to need to retain and store the text that the user types in when they use the search box. This text is the search query, and it is a piece of *[state][TODO: link to state]* that is going to change whenever the user types something into the search box.

But where are we going to put this newly-introduced piece of state? In order to wire up the search box, we need a place to store the search query. At the moment, our search box lives on the `index.hbs` route template, which doesn't have a good place to store this search query state. Darn, this would be so much easier to do if we had a component, because we could just store the state directly on the component!

Wait...why don't we just refactor the search box into a component? Once we do that, this will all be a bit easier&mdash;hooray!

Let's start simple again and begin our refactor by creating a new template for our component, which we will call `rentals.hbs`.

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

There is one minor change to note here: while extracting our markup into a component, we also renamed the `@model` argument to be `@rentals` instead, just in order to be a little more specific about what we're iterating over in our `{{#each}}` loop. Otherwise, all we're doing here is copy-pasting what was on our `index.hbs` page into our new component template. Now we just need to actually use our new component in the index template where we started this whole refactor! Let's render our `<Rentals>` component in our `index.hbs` template.

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

Remember the small change we made in the markup when we extracted our `<Rentals>` component? We renamed the `@model` argument to be `@rentals`. Because we made that change in our component, we now need to pass the `@model` argument into the `<Rentals>` component as `@rentals`. Once we do this, everything should be wired up properly so that the `@model` is passed into `<Rentals>` as `@rentals`, just as we expect.

Let's check our UI as well to make sure that we didn't break anything during this refactor...

```run:command hidden=true cwd=super-rentals
yarn test --path dist
git add app/components/rentals.hbs
git add app/templates/index.hbs
```

```run:screenshot width=1024 retina=true filename=homepage-with-rentals-component.png alt="The homepage looks exactly the same as before!"
visit http://localhost:4200/
wait  .rentals input
```

Awesome, it looks exactly the same!

Now that we've finished our refactor and tried it out in the UI, let's write a test for it as well.

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

Now, if we try running our tests, they should all pass after making this change.

```run:command hidden=true cwd=super-rentals
yarn test --path dist
git add tests/integration/components/rentals-test.js
```

```run:screenshot width=1024 height=1024 retina=true filename=pass-1.png alt="The new test is passing."
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

## Using Ember's `<Input>`

Now that we have our component all set up, we can finally wire up our search box and store our search query! First things first: let's create a component class to store our query state.

```run:file:create lang=js cwd=super-rentals filename=app/components/rentals.js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class RentalsComponent extends Component {
  @tracked query = '';
}
```

Next, we'll wire up our query state in the component template.

```run:file:patch lang=handlebars cwd=super-rentals filename=app/components/rentals.hbs
@@ -3,3 +3,3 @@
     <span>Where would you like to stay?</span>
-    <input class="light">
+    <Input @value={{this.query}} class="light" />
   </label>
```

Interesting! There are a few things happening in this one-line template change. First, we're moving from using a plain HTML `<input>` tag to using an `<Input>` tag instead! As it turns out, Ember provides us with a helpful little *[<Input> component][TODO: link to input component]* for this exact use case. The `<Input>` component is actually just a wrapper around the `<input>` element.

Ember's `<Input>` component is pretty neat; it will wire up things behind the scenes such that, whenever the user types something into the input box, `this.query` changes accordingly. In other words, `this.query` is kept in sync with the value of what is being searched; we finally have the perfect way of storing the state of our search query!

> Zoey says...
>
> If you want to see this in action, try adding `<p>{{this.query}}</p>` to the component template and watch it update live as you type!

```run:command hidden=true cwd=super-rentals
yarn test --path dist
git add app/components/rentals.hbs
git add app/components/rentals.js
```

## Adding the `<Rentals::Filter>` Provider Component

Now that our search query is wired up to our `<Rentals>` component, we can get into the really fun stuff! Namely, we can make our component *filter* results based on our search query. In order to encapsulate this functionality, we'll create another component called `<Rentals::Filter>`.

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

In the `<Rentals::Filter>` component class, we have created a getter to do the work of filtering through our rentals based on two arguments: `@rentals` and `@query`. Inside of our getter function, we have these arguments accessible to us from `this.args`.

In our component template, we are not actually *rendering* anything. Instead, we're yielding to something, using the `{{yield}}` keyword, a syntax that [we have seen before](../04-component-basics/). As we might recall, the purpose of `{{yield}}` is to render the *block* that is passed in by the component's *caller*, which is the thing that is invoking the current component (a template or another component, for example). But in this specific case, we don't just have a `{{yield}}` keyword. Instead, we have `this.results` *inside* of our `{{yield}}` keyword. What is that doing, exactly?

Well, in order to answer this question, let's look at how the data that we're yielding is being used in the `<Rentals>` component.

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

Here, we're invoking `<Rentals::Filter>` similar to how we've invoked other components. We're passing in `@rentals` and `@query` as arguments, and we're also passing in a block. The block is the content that is enclosed in between the component's opening and closing tags (`<Rentals::Filter>...</Rentals::Filter>`). We have seen both of these before.

However, the main difference here is the use of `as |results|` when we are invoking our `<Rentals::Filter>` component. Incidentally, this new syntax goes hand-in-hand with the `{{yield this.results}}` syntax we were introduced to in the component template.

The `as |results|` syntax might look a little new to us, but it isn't the first time that we've seen this feature in action. Back when we first learned about the `{{#each}}` syntax, which we use to loop over a collection, we wrote something like this: `{{#each @items as |item|}}...some content here...{{/each}}`.

When we use this syntax, we are passing a block&mdash;the `...some content here...` in our example&mdash;to `{{#each}}`. Ember will iterate through the array we provided (`@items`) and render our block *once per item* in the array.

Inside of our block, we need to be able to access the current item *somehow*. The `{{#each}}` syntax provides the item to our block via the `as |item|` declaration, which creates a local variable `item`, also known as a *[block parameter][TODO: link to block parameter]*.. In other words, as we iterate through `@items`, we will have access to the current item that we're looping over through the block parameter (`item`) The block parameter is only accessible from within inside of the block. Ember will fill in the block parameter with the current item of the iteration, and it will do this each time that it renders our block.

The need to provide some data to a block is not unique to the `{{#each}}` syntax. In this case, our `<Rentals::Filter>` component wants to take the unfiltered list of rental properties and match them against the user's query. Once the component has matched the rentals against the query, it will need to provide a filtered list of rental properties to its caller (the `<Rentals>` component).

As it turns out, this ability to provide block params is not a superpower that only built-in syntaxes like `{{#each}}` can use. We can do this with our own components as well. In fact, Ember allows us to pass arbitrary data to blocks in the form of passing in additional arguments to the `{{yield}}` keyword. Indeed, this is exactly what we did with `{{yield this.results}}` in the `<Rentals::Filter>` component.

In our `<Rentals>` component, we used the `as |results|` syntax when invoking `<Rentals::Filter>`. Just like with the `{{#each}}` syntax, this block parameter syntax allowed our block to access the yielded data using the local variable `results`. The yielded data came from `{{yield this.results}}`, where `this.results` is our filtered list of rental properties.

> Zoey says...
>
> The local variable name `results` is arbitrary, and isn't special in any way! You could name it anything: `as |data|`, `as |filtered|`, or even `as |banana|`! In fact, the `... as |banana|` syntax is the same as declaring a local variable in JavaScript.
> Just as we can create a variable like `let banana = ...`, and then have access to that variable whenever we call `banana`, we can also have access to the yielded item by using whatever variable name we gave to our black parameter. The important thing here is that however you name the block param is how you will have access to the yielded data from inside the block.

Interestingly, if we take a look at our `<Rentals::Filter>` component template, we see that we don't actually render any content. Instead, this component's only responsibility is to set up some piece of state (`this.results`, the list of filtered rental properties), and then yield that state back up to its caller (`<Rentals>`) in the form of a block parameter (`as |results|`).

This is called the *[provider component pattern][TODO: link to provider component pattern]*, which we see in action with one component providing data up to its caller.

Okay, now that we have a better sense of which component is rendering what and the theory behind why all of this is happening, let's answer the big unanswered question: does this even work? If we try out our search box in the UI, what happens?

```run:screenshot width=1024 retina=true filename=filtered-results.png alt="Trying out the search box."
visit http://localhost:4200/
wait  .rentals input
type  .rentals input, Downtown
wait  .rental
```

Hooray, it works! Awesome. Now that we've tried this out manually in the UI, let's write a tests for this new behavior as well.

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

Great! In the process of adding this test, we'll notice that we also extracted our setup (`setProperties`) into the before hooks. We also used the `fillIn` test helper in our newly-added test.

> Zoey says...
>
> This search functionality is not perfect. Ideally, it would also be case-insensitive, and also allow you to search by city, category, type, or description. If you're looking for a challenge, see if you can improve on our search!

```run:command hidden=true cwd=super-rentals
yarn test --path dist
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
