```run:server:start hidden=true cwd=super-rentals expect="Serving on http://localhost:4200/"
ember server
```

It's time to finally work on the rentals listing:

![The Super Rentals app by the end of the chapter](/screenshots/05-more-about-components/rental-image@2x.png)

While building this list of rental properties, you will learn about:

* Generating components
* Organizing code with namespaced components
* Forwarding HTML attributes with `...attributes`
* Determining the appropriate amount of test coverage

## Generating Components

Let's start by creating the `<Rental>` component. This time, we will use the component generator to create the template and test file for us:

```run:command cwd=super-rentals
ember generate component rental
```

The generator created two new files for us, a component template at `app/components/rental.hbs`, and a component test file at `tests/integration/components/rental-test.js`.

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/rental.hbs
git add tests/integration/components/rental-test.js
```

We will start by editing the template. Let's *[hard-code](https://en.wikipedia.org/wiki/Hard_coding)* the details for one rental property for now, and replace it with the real data from the server later on.

```run:file:patch lang=handlebars cwd=super-rentals filename=app/components/rental.hbs
@@ -1,1 +1,17 @@
-{{yield}}
\ No newline at end of file
+<article class="rental">
+  <div class="details">
+    <h3>Grand Old Mansion</h3>
+    <div class="detail owner">
+      <span>Owner:</span> Veruca Salt
+    </div>
+    <div class="detail type">
+      <span>Type:</span> Standalone
+    </div>
+    <div class="detail location">
+      <span>Location:</span> San Francisco
+    </div>
+    <div class="detail bedrooms">
+      <span>Number of bedrooms:</span> 15
+    </div>
+  </div>
+</article>
```

Then, we will write a test to ensure all of the details are present. We will replace the boilerplate test generated for us with our own assertions, just like we did for the `<Jumbo>` component earlier:

```run:file:patch lang=js cwd=super-rentals filename=tests/integration/components/rental-test.js
@@ -8,18 +8,11 @@

-  test('it renders', async function(assert) {
-    // Set any properties with this.set('myProperty', 'value');
-    // Handle any actions with this.set('myAction', function(val) { ... });
-
-    await render(hbs`<Rental />`);
-
-    assert.equal(this.element.textContent.trim(), '');
-
-    // Template block usage:
-    await render(hbs`
-      <Rental>
-        template block text
-      </Rental>
-    `);
-
-    assert.equal(this.element.textContent.trim(), 'template block text');
+  test('it renders information about a rental property', async function(assert) {
+    await render(hbs`<Rental />`);
+
+    assert.dom('article').hasClass('rental');
+    assert.dom('article h3').hasText('Grand Old Mansion');
+    assert.dom('article .detail.owner').includesText('Veruca Salt');
+    assert.dom('article .detail.type').includesText('Standalone');
+    assert.dom('article .detail.location').includesText('San Francisco');
+    assert.dom('article .detail.bedrooms').includesText('15');
   });
```

The test should pass.

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/rental.hbs
git add tests/integration/components/rental-test.js
```

```run:screenshot width=1024 height=512 retina=true filename=pass.png alt="Tests passing with the new <Rental> test"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

Finally, let's invoke this a couple of times from our index template to populate the page.

```run:file:patch lang=js cwd=super-rentals filename=app/templates/index.hbs
@@ -5 +5,9 @@
 </Jumbo>
+
+<div class="rentals">
+  <ul class="results">
+    <li><Rental /></li>
+    <li><Rental /></li>
+    <li><Rental /></li>
+  </ul>
+</div>
```

```run:command hidden=true cwd=super-rentals
yarn test
git add app/templates/index.hbs
```

With that, we should see the `<Rental>` component showing our Grand Old Mansion three times on the page:

```run:screenshot width=1024 retina=true filename=three-old-mansions.png alt="Three Grand Old Mansions"
visit http://localhost:4200/
wait  .rentals li:nth-of-type(3) article.rental
```

Things are looking pretty convincing already; not bad for just a little bit of work!

## Organizing Code with Namespaced Components

Next, let's add the image for the rental property. We will use the component generator for this again:

```run:command cwd=super-rentals
ember generate component rental/image
```

This time, we had a `/` in the component's name. This resulted in the component being created at `app/components/rental/image.hbs`, which can be invoked as `<Rental::Image>`.

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/rental/image.hbs
git add tests/integration/components/rental/image-test.js
```

Components like these are known as *[namespaced](https://en.wikipedia.org/wiki/Namespace)* components. Namespacing allows us to organize our components by folders according to their purpose. This is completely optional &mdash; namespaced components are not special in any way.

## Forwarding HTML Attributes with `...attributes`

Let's edit the component's template:

```run:file:patch lang=handlebars cwd=super-rentals filename=app/components/rental/image.hbs
@@ -1,1 +1,3 @@
-{{yield}}
\ No newline at end of file
+<div class="image">
+  <img ...attributes>
+</div>
```

Instead of hard-coding specific values for the `src` and `alt` attributes on the `<img>` tag, we opted for the `...attributes` keyword instead, which is also sometimes referred to as the *["splattributes"][TODO: link to splattributes]* syntax. This allows arbitrary HTML attributes to be passed in when invoking this component, like so:

```run:file:patch lang=handlebars cwd=super-rentals filename=app/components/rental.hbs
@@ -1,2 +1,6 @@
 <article class="rental">
+  <Rental::Image
+    src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Crane_estate_(5).jpg"
+    alt="A picture of Grand Old Mansion"
+  />
   <div class="details">
```

We specified a `src` and an `alt` HTML attribute here, which will be passed along to the component and attached to the element where `...attributes` is applied in the component template. You can think of this as being similar to `{{yield}}`, but for HTML attributes specifically, rather than displayed content. In fact, we have already used this feature [earlier](../02-building-pages/) when we passed a `class` attribute to `<LinkTo>`.

```run:screenshot width=1024 retina=true filename=rental-image.png alt="The <Rental::Image> component in action"
visit http://localhost:4200/
wait  .rentals li:nth-of-type(3) article.rental .image img
```

This way, our `<Rental::Image>` component is not coupled to any specific rental property on the site. Of course, the hard-coding problem still exists (we simply moved it to the `<Rental>` component), but we will deal with that soon. We will limit all the hard-coding to the `<Rental>` component, so that we will have an easier time cleaning it up when we switch to fetching real data.

In general, it is a good idea to add `...attributes` to the primary element in your component. This will allow for maximum flexibility, as the invoker may need to pass along classes for styling or ARIA attributes to improve accessibility.

Let's write a test for our new component!

```run:file:patch lang=js cwd=super-rentals filename=tests/integration/components/rental/image-test.js
@@ -8,18 +8,13 @@

-  test('it renders', async function(assert) {
-    // Set any properties with this.set('myProperty', 'value');
-    // Handle any actions with this.set('myAction', function(val) { ... });
-
-    await render(hbs`<Rental::Image />`);
-
-    assert.equal(this.element.textContent.trim(), '');
-
-    // Template block usage:
-    await render(hbs`
-      <Rental::Image>
-        template block text
-      </Rental::Image>
-    `);
-
-    assert.equal(this.element.textContent.trim(), 'template block text');
+  test('it renders the given image', async function(assert) {
+    await render(hbs`
+      <Rental::Image
+        src="/assets/images/teaching-tomster.png"
+        alt="Teaching Tomster"
+      />
+    `);
+
+    assert.dom('.image').exists();
+    assert.dom('.image img').hasAttribute('src', '/assets/images/teaching-tomster.png');
+    assert.dom('.image img').hasAttribute('alt', 'Teaching Tomster');
   });
```

## Determining the Appropriate Amount of Test Coverage

Finally, we should also update the tests for the `<Rental>` component to confirm that we successfully invoked `<Rental::Image>`.

```run:file:patch lang=js cwd=super-rentals filename=tests/integration/components/rental-test.js
@@ -17,2 +17,3 @@
     assert.dom('article .detail.bedrooms').includesText('15');
+    assert.dom('article .image').exists();
   });
```

Because we already tested `<Rental::Image>` extensively on its own, we can omit the details here and keep our assertion to the bare minimum. That way, we won't  _also_ have to update the `<Rental>` tests whenever we make changes to `<Rental::Image>`.

```run:command hidden=true cwd=super-rentals
yarn test
git add app/components/rental.hbs
git add app/components/rental/image.hbs
git add tests/integration/components/rental-test.js
git add tests/integration/components/rental/image-test.js
```

```run:screenshot width=1024 height=512 retina=true filename=pass-2.png alt="Tests passing with the new <Rental::Image> test"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

```run:server:stop
ember server
```

```run:checkpoint cwd=super-rentals
Chapter 5
```
