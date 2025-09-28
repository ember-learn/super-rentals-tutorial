<!--lint disable no-undefined-references-->

```run:server:start hidden=true cwd=super-rentals expect="Local:   http://localhost:4200/"
npm start
```

It's time to finally work on the rentals listing:

![The Super Rentals app by the end of the chapter](/images/tutorial/part-1/more-about-components/rental-image@2x.png)

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

The generator created two new files for us, a component template at `app/components/rental.gjs`, and a component test file at `tests/integration/components/rental-test.gjs`.

```run:command hidden=true cwd=super-rentals
ember test --path dist
git add app/components/rental.gjs
git add tests/integration/components/rental-test.gjs
```

We will start by editing the component template. Let's *[hard-code](https://en.wikipedia.org/wiki/Hard_coding)* the details for one rental property for now, and replace it with the real data from the server later on.

```run:file:patch lang=gjs cwd=super-rentals filename=app/components/rental.gjs
@@ -1,3 +1,19 @@
 <template>
-  {{yield}}
+  <article class="rental">
+    <div class="details">
+      <h3>Grand Old Mansion</h3>
+      <div class="detail owner">
+        <span>Owner:</span> Veruca Salt
+      </div>
+      <div class="detail type">
+        <span>Type:</span> Standalone
+      </div>
+      <div class="detail location">
+        <span>Location:</span> San Francisco
+      </div>
+      <div class="detail bedrooms">
+        <span>Number of bedrooms:</span> 15
+      </div>
+    </div>
+  </article>
 </template>
```

Then, we will write a test to ensure all of the details are present. We will replace the boilerplate test generated for us with our own assertions, just like we did for the `<Jumbo>` component earlier:

```run:file:patch lang=gjs cwd=super-rentals filename=tests/integration/components/rental-test.gjs
@@ -8,20 +8,11 @@ module('Integration | Component | rental', function (hooks) {
 
-  test('it renders', async function (assert) {
-    // Updating values is achieved using autotracking, just like in app code. For example:
-    // class State { @tracked myProperty = 0; }; const state = new State();
-    // and update using state.myProperty = 1; await rerender();
-    // Handle any actions with function myAction(val) { ... };
-
+  test('it renders information about a rental property', async function (assert) {
     await render(<template><Rental /></template>);
 
-    assert.dom().hasText('');
-
-    // Template block usage:
-    await render(<template>
-      <Rental>
-        template block text
-      </Rental>
-    </template>);
-
-    assert.dom().hasText('template block text');
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
ember test --path dist
git add app/components/rental.gjs
git add tests/integration/components/rental-test.gjs
```

```run:screenshot width=1024 height=512 retina=true filename=pass.png alt="Tests passing with the new <Rental> test"
visit http://localhost:4200/tests?nocontainer&nolint&deterministic
wait  #qunit-banner.qunit-pass
```

Finally, let's invoke this a couple of times from our index template to populate the page.

```run:file:patch lang=gjs cwd=super-rentals filename=app/templates/index.gjs
@@ -2,2 +2,3 @@ import { LinkTo } from '@ember/routing';
 import Jumbo from 'super-rentals/components/jumbo';
+import Rental from 'super-rentals/components/rental';
 
@@ -9,2 +10,10 @@ import Jumbo from 'super-rentals/components/jumbo';
   </Jumbo>
+
+  <div class="rentals">
+    <ul class="results">
+      <li><Rental /></li>
+      <li><Rental /></li>
+      <li><Rental /></li>
+    </ul>
+  </div>
 </template>
```

```run:command hidden=true cwd=super-rentals
ember test --path dist
git add app/templates/index.gjs
```

With that, we should see the `<Rental>` component showing our Grand Old Mansion three times on the page:

```run:screenshot width=1024 retina=true filename=three-old-mansions.png alt="Three Grand Old Mansions"
visit http://localhost:4200/?deterministic
wait  .rentals li:nth-of-type(3) article.rental
```

Things are looking pretty convincing already; not bad for just a little bit of work!

## Organizing Code in Folders

Next, let's add the image for the rental property. We will use the component generator for this again:

```run:command cwd=super-rentals
ember generate component rental/image
```

This time, we had a `/` in the component's name. This resulted in the component being created at `app/components/rental/image.gjs`.

```run:command hidden=true cwd=super-rentals
ember test --path dist
git add app/components/rental/image.gjs
git add tests/integration/components/rental/image-test.gjs
```

We can organize our components by folders according to their purpose. This is completely optional&mdash;these components are not special in any way.

## Forwarding HTML Attributes with `...attributes`

Let's edit the component's template:

```run:file:patch lang=gjs cwd=super-rentals filename=app/components/rental/image.gjs
@@ -1,3 +1,5 @@
 <template>
-  {{yield}}
+  <div class="image">
+    <img ...attributes />
+  </div>
 </template>
```

Instead of hard-coding specific values for the `src` and `alt` attributes on the `<img>` tag, we opted for the `...attributes` keyword instead, which is also sometimes referred to as the *["splattributes"](../../../components/component-arguments-and-html-attributes/#toc_html-attributes)* syntax. This allows arbitrary HTML attributes to be passed in when invoking this component, like so:

```run:file:patch lang=gjs cwd=super-rentals filename=app/components/rental.gjs
@@ -1,3 +1,9 @@
+import RentalImage from 'super-rentals/components/rental/image';
+
 <template>
   <article class="rental">
+    <RentalImage
+      src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Crane_estate_(5).jpg"
+      alt="A picture of Grand Old Mansion"
+    />
     <div class="details">
```

We specified a `src` and an `alt` HTML attribute here, which will be passed along to the component and attached to the element where `...attributes` is applied in the component template. You can think of this as being similar to `{{yield}}`, but for HTML attributes specifically, rather than displayed content. In fact, we have already used this feature [earlier](../building-pages/) when we passed a `class` attribute to `<LinkTo>`.

```run:screenshot width=1024 retina=true filename=rental-image.png alt="The <RentalImage> component in action"
visit http://localhost:4200/?deterministic
wait  .rentals li:nth-of-type(3) article.rental .image img
```

This way, our `<RentalImage>` component is not coupled to any specific rental property on the site. Of course, the hard-coding problem still exists (we simply moved it to the `<Rental>` component), but we will deal with that soon. We will limit all the hard-coding to the `<Rental>` component, so that we will have an easier time cleaning it up when we switch to fetching real data.

In general, it is a good idea to add `...attributes` to the primary element in your component. This will allow for maximum flexibility, as the invoker may need to pass along classes for styling or ARIA attributes to improve accessibility.

Let's write a test for our new component!

```run:file:patch lang=gjs cwd=super-rentals filename=tests/integration/components/rental/image-test.gjs
@@ -3,3 +3,3 @@ import { setupRenderingTest } from 'super-rentals/tests/helpers';
 import { render } from '@ember/test-helpers';
-import Image from 'super-rentals/components/rental/image';
+import RentalImage from 'super-rentals/components/rental/image';
 
@@ -8,21 +8,16 @@ module('Integration | Component | rental/image', function (hooks) {
 
-  test('it renders', async function (assert) {
-    // Updating values is achieved using autotracking, just like in app code. For example:
-    // class State { @tracked myProperty = 0; }; const state = new State();
-    // and update using state.myProperty = 1; await rerender();
-    // Handle any actions with function myAction(val) { ... };
-
-    await render(<template><Image /></template>);
-
-    assert.dom().hasText('');
-
-    // Template block usage:
+  test('it renders the given image', async function (assert) {
     await render(<template>
-      <Image>
-        template block text
-      </Image>
+      <RentalImage
+        src="/assets/images/teaching-tomster.png"
+        alt="Teaching Tomster"
+      />
     </template>);
 
-    assert.dom().hasText('template block text');
-  });
+    assert
+      .dom('.image img')
+      .exists()
+      .hasAttribute('src', '/assets/images/teaching-tomster.png')
+      .hasAttribute('alt', 'Teaching Tomster');
+   });
 });
```

## Determining the Appropriate Amount of Test Coverage

Finally, we should also update the tests for the `<Rental>` component to confirm that we successfully invoked `<RentalImage>`.

```run:file:patch lang=gjs cwd=super-rentals filename=tests/integration/components/rental-test.gjs
@@ -17,2 +17,3 @@ module('Integration | Component | rental', function (hooks) {
     assert.dom('article .detail.bedrooms').includesText('15');
+    assert.dom('article .image').exists();
   });
```

Because we already tested `<RentalImage>` extensively on its own, we can omit the details here and keep our assertion to the bare minimum. That way, we won't  *also* have to update the `<Rental>` tests whenever we make changes to `<RentalImage>`.

```run:command hidden=true cwd=super-rentals
ember test --path dist
git add app/components/rental.gjs
git add app/components/rental/image.gjs
git add tests/integration/components/rental-test.gjs
git add tests/integration/components/rental/image-test.gjs
```

```run:screenshot width=1024 height=512 retina=true filename=pass-2.png alt="Tests passing with the new <RentalImage> test"
visit http://localhost:4200/tests?nocontainer&nolint&deterministic
wait  #qunit-banner.qunit-pass
```

```run:server:stop
npm start
```

```run:checkpoint cwd=super-rentals
Chapter 5
```
