```run:server:start hidden=true cwd=super-rentals expect="Serving on http://localhost:4200/"
ember server
```

In this chapter, you will *[refactor][TODO: link to refactor]* your existing templates to use components. We will also be adding a site-wide navigation bar:

![The Super Rentals app by the end of the chapter](/screenshots/04-component-basics/index-with-nav@2x.png)

In doing so, you will learn about:

* Extracting markup into components
* Invoking components
* Passing content to components
* Yielding content with the `{{yield}}` keyword
* Refactoring existing code
* Writing component tests
* Using the application template and `{{outlet}}`s

## Extracting Markup into Components

In a [previous chapter](../02-building-pages/), we got a light introduction to *[components][TODO: link to components]* when using `<LinkTo>` to connect our pages. To recap, we said that components are Ember's way of creating *[custom tags][TODO: link to custom tags]* to supplement the built-in HTML tags from the browser. Now, we are going to create our own components!

During the course of developing an app, it is pretty common to reuse the same UI element across different parts of the app. For example, we have been using the same "jumbo" header in all three pages so far. On every page we worked to follow the same basic structure:

```html
<div class="jumbo">
  <div class="right tomster"></div>
  <!-- page specific content -->
</div>
```

Since it is not a lot of code, it may not seem like a big deal to duplicate this structure on each page. However, if our designer wanted us to make a change to the header, we would have to find and update every single copy of this code. As our app gets bigger, this will become even more of a problem.

Components are the perfect solution to this. In its most basic form, a component is just a piece of template that can be referred to by name. Let's start by creating a new file at `app/components/jumbo.hbs` with markup for the "jumbo" header:

```run:file:create lang=handlebars cwd=super-rentals filename=app/components/jumbo.hbs
<div class="jumbo">
  <div class="right tomster"></div>
  {{yield}}
</div>
```

```run:command hidden=true cwd=super-rentals
git add app/components/jumbo.hbs
```

That's it, we have created our first component! We can now *[invoke][TODO: link to invoke]* this component anywhere in our app, using `<Jumbo>` as the tag name.

> Zoey says...
>
> Remember, when invoking components, we need to capitalize their names so Ember can tell them apart from regular HTML elements. The `jumbo.hbs` template corresponds to the `<Jumbo>` tag, just like `super-awesome.hbs` corresponds to `<SuperAwesome>`.

## Passing Content to Components with `{{yield}}`

When invoking a component, Ember will replace the component tag with the content found in the component's template. Just like regular HTML tags, it is common to pass *[content][TODO: link to content]* to components, like `<Jumbo>some content</Jumbo>`. We can enable this using the `{{yield}}` keyword, which will be replaced with the content that was passed to the component.

Let's try it out by editing the index template:

```run:file:patch lang=js cwd=super-rentals filename=app/templates/index.hbs
@@ -1,3 +1,2 @@
-<div class="jumbo">
-  <div class="right tomster"></div>
+<Jumbo>
   <h2>Welcome to Super Rentals!</h2>
@@ -5,2 +4,2 @@
   <LinkTo @route="about" class="button">About Us</LinkTo>
-</div>
+</Jumbo>
```

## Refactoring Existing Code

After saving the changes, your page should automatically reload, and, _voilà_... nothing changed? Well, that's exactly what we wanted to happen this time! We successfully *[refactored][TODO: link to refactored]* our index template to use the `<Jumbo>` component, and everything still works as expected. And the tests still pass!

```run:screenshot width=1024 retina=true filename=index.png alt="Index page – nothing changed"
visit http://localhost:4200/
```

```run:screenshot width=1024 height=512 retina=true filename=pass.png alt="Tests still passing after the refactor"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

Let's do the same for our other two pages as well.

```run:file:patch lang=js cwd=super-rentals filename=app/templates/about.hbs
@@ -1,5 +1,4 @@
-<div class="jumbo">
-  <div class="right tomster"></div>
+<Jumbo>
   <h2>About Super Rentals</h2>
   <p>
     The Super Rentals website is a delightful project created to explore Ember.
@@ -7,4 +6,4 @@
     AND building Ember applications.
   </p>
   <LinkTo @route="contact" class="button">Contact Us</LinkTo>
-</div>
+</Jumbo>
```

```run:file:patch lang=js cwd=super-rentals filename=app/templates/contact.hbs
@@ -1,5 +1,4 @@
-<div class="jumbo">
-  <div class="right tomster"></div>
+<Jumbo>
   <h2>Contact Us</h2>
   <p>
     Super Rentals Representatives would love to help you<br>
@@ -15,4 +14,4 @@
     <a href="mailto:superrentalsrep@emberjs.com">superrentalsrep@emberjs.com</a>
   </address>
   <LinkTo @route="about" class="button">About</LinkTo>
-</div>
+</Jumbo>
```

After saving, everything should look exactly the same as before, and all the tests should still pass. Very nice!

```run:command hidden=true cwd=super-rentals
yarn test
git add app/templates/index.hbs
git add app/templates/about.hbs
git add app/templates/contact.hbs
```

```run:screenshot width=1024 retina=true filename=about.png alt="About page – nothing changed"
visit http://localhost:4200/about
```

```run:screenshot width=1024 retina=true filename=contact.png alt="Contact page – nothing changed"
visit http://localhost:4200/getting-in-touch
```

```run:screenshot width=1024 height=512 retina=true filename=pass-2.png alt="Tests still passing another round of refactor"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

While it may not save you a lot of characters in this case, *[encapsulating][TODO: link to encapsulating]* the implementation of the "jumbo" header into its own component makes the template slightly easier to read, as it allows the reader to focus on things that are unique to just that page. Further, if we need to make a change to the header, we can make it in a single place. Feel free to give that a try!

## Writing Component Tests

Before we move on to the next component, let's write an automated test for our `<Jumbo>` component. Run this command in your terminal:

```run:command cwd=super-rentals
ember generate component-test jumbo
```

```run:command hidden=true cwd=super-rentals
git add tests/integration/components/jumbo-test.js
```

Here, we used the generator to generate a *[component test][TODO: link to component test]*, also known as a *[rendering test][TODO: link to rendering test]*. These are used to render and test a single component at a time. This is in contrast to the acceptance tests that we wrote earlier, which have to navigate and render entire pages worth of content.

Let's replace the boilerplate code that was generated for us with our own test:

```run:file:patch lang=js cwd=super-rentals filename=tests/integration/components/jumbo-test.js
@@ -8,18 +8,8 @@

-  test('it renders', async function(assert) {
-    // Set any properties with this.set('myProperty', 'value');
-    // Handle any actions with this.set('myAction', function(val) { ... });
-
-    await render(hbs`<Jumbo />`);
-
-    assert.equal(this.element.textContent.trim(), '');
-
-    // Template block usage:
-    await render(hbs`
-      <Jumbo>
-        template block text
-      </Jumbo>
-    `);
-
-    assert.equal(this.element.textContent.trim(), 'template block text');
+  test('it renders the content inside a jumbo header with a tomster', async function(assert) {
+    await render(hbs`<Jumbo>Hello World</Jumbo>`);
+
+    assert.dom('.jumbo').exists();
+    assert.dom('.jumbo').hasText('Hello World');
+    assert.dom('.jumbo .tomster').exists();
   });
```

Instead of navigating to a URL, we start the test by rendering our `<Jumbo>` component on the test page. This is useful because it may otherwise require a lot of setup and interaction just to get to a page where your component is used. Component tests allows us to skip all of that and focus exclusively on testing the component in isolation.

Just like visit and click, which we used earlier, render is also an async step, so we need to pair it with the `await` keyword. Other than that, the rest of the test is very similar to the acceptance tests we wrote in the previous chapter. Make sure the test is passing by checking the tests UI in the browser.

```run:command hidden=true cwd=super-rentals
yarn test
git add tests/integration/components/jumbo-test.js
```

```run:screenshot width=1024 height=512 retina=true filename=pass-3.png alt="Tests still passing with our component test"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

We've been refactoring our existing code for a while, so let's change gears and implement a new feature: the site-wide navigation bar.

We can create a `<NavBar>` component at `app/components/nav-bar.hbs`:

```run:file:create lang=handlebars cwd=super-rentals filename=app/components/nav-bar.hbs
<nav class="menu">
  <LinkTo @route="index" class="menu-index">
    <h1>SuperRentals</h1>
  </LinkTo>
  <div class="links">
    <LinkTo @route="about" class="menu-about">
      About
    </LinkTo>
    <LinkTo @route="contact" class="menu-contact">
      Contact
    </LinkTo>
  </div>
</nav>
```

```run:command hidden=true cwd=super-rentals
git add app/components/nav-bar.hbs
```

Next, we will add our `<NavBar>` component to the top of each page:

```run:file:patch lang=js cwd=super-rentals filename=app/templates/about.hbs
@@ -1 +1,2 @@
+<NavBar />
 <Jumbo>
```

```run:file:patch lang=js cwd=super-rentals filename=app/templates/contact.hbs
@@ -1 +1,2 @@
+<NavBar />
 <Jumbo>
```

```run:file:patch lang=js cwd=super-rentals filename=app/templates/index.hbs
@@ -1 +1,2 @@
+<NavBar />
 <Jumbo>
```

Voilà, we made another component!

```run:screenshot width=1024 retina=true filename=index-with-nav.png alt="Index page with nav"
visit http://localhost:4200/
```

```run:command hidden=true cwd=super-rentals
git add app/templates/about.hbs
git add app/templates/contact.hbs
git add app/templates/index.hbs
```

> Zoey says...
>
> `<NavBar />` is a shorthand for `<NavBar></NavBar>`. Component tags must always be closed properly, even when you are not passing any content to them, as in this case. Since this is pretty common, Ember provides the alternative self-closing shorthand to save you some typing!

Everything looks great in the browser, but as we know, we can never be too sure. So let's write some tests!

But what kind of test? We _could_ write a component test for the `<NavBar>` by itself, like we just did for the `<Jumbo>` component. However, since the job of `<NavBar>` is to _navigate_ us around the app, it would not make a lot of sense to test this particular component in isolation. So, let's go back to writing some acceptance tests!

```run:file:patch lang=js cwd=super-rentals filename=tests/acceptance/super-rentals-test.js
@@ -11,2 +11,4 @@
     assert.equal(currentURL(), '/');
+    assert.dom('nav').exists();
+    assert.dom('h1').hasText('SuperRentals');
     assert.dom('h2').hasText('Welcome to Super Rentals!');
@@ -23,2 +25,4 @@
     assert.equal(currentURL(), '/about');
+    assert.dom('nav').exists();
+    assert.dom('h1').hasText('SuperRentals');
     assert.dom('h2').hasText('About Super Rentals');
@@ -35,2 +39,4 @@
     assert.equal(currentURL(), '/getting-in-touch');
+    assert.dom('nav').exists();
+    assert.dom('h1').hasText('SuperRentals');
     assert.dom('h2').hasText('Contact Us');
@@ -42,2 +48,20 @@
   });
+
+  test('navigating using the nav-bar', async function(assert) {
+    await visit('/');
+
+    assert.dom('nav').exists();
+    assert.dom('nav a.menu-index').hasText('SuperRentals')
+    assert.dom('nav a.menu-about').hasText('About');
+    assert.dom('nav a.menu-contact').hasText('Contact');
+
+    await click('nav a.menu-about');
+    assert.equal(currentURL(), '/about');
+
+    await click('nav a.menu-contact');
+    assert.equal(currentURL(), '/getting-in-touch');
+
+    await click('nav a.menu-index');
+    assert.equal(currentURL(), '/');
+  });
 });
```

We updated the existing tests to assert that a `<nav>` element exists on each page. This is important for accessibility since screen readers will use that element to provide navigation. Then, we added a new test that verifies the behavior of the `<NavBar>` links.

All tests should pass at this point!

```run:command hidden=true cwd=super-rentals
yarn test
git add tests/acceptance/super-rentals-test.js
```

```run:screenshot width=1024 height=512 retina=true filename=pass-4.png alt="Tests still passing with our <NavBar> tests"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

## Using the Application Template and `{{outlet}}`s

Before we move on to the next feature, there is one more thing we could clean up. Since the `<NavBar>` is used for site-wide navigation, it really needs to be displayed on _every_ page in the app. So far, we have been adding the component on each page manually. This is a bit error-prone, as we could easily forget to do this the next time that we add a new page.

We can solve this problem by moving the nav-bar into a special template called `application.hbs`. You may remember that it was generated for us when we first created the app but we deleted it. Now, it's time for us to bring it back!

This template is special in that it does not have its own URL and cannot be navigated to on its own. Rather, it is used to specify a common layout that is shared by every page in your app. This is a great place to put site-wide UI elements, like a nav-bar and a site footer.

While we are at it, we will also add a container element that wraps around the whole page, as requested by our designer for styling purposes.

```run:file:create lang=handlebars cwd=super-rentals filename=app/templates/application.hbs
<div class="container">
  <NavBar />
  <div class="body">
    {{outlet}}
  </div>
</div>
```

```run:file:patch lang=js cwd=super-rentals filename=app/templates/index.hbs
@@ -1,2 +1 @@
-<NavBar />
 <Jumbo>
```


```run:file:patch lang=js cwd=super-rentals filename=app/templates/contact.hbs
@@ -1,2 +1 @@
-<NavBar />
 <Jumbo>
```

```run:file:patch lang=js cwd=super-rentals filename=app/templates/about.hbs
@@ -1,2 +1 @@
-<NavBar />
 <Jumbo>
```

The `{{outlet}}` keyword denotes the place where our site's pages should be rendered into, similar to the `{{yield}}` keyword we saw [earlier][TODO: add anchor link back to where we first mentioned it].

This is much nicer! We can run our test suite, which confirms that everything still works after our refactor. We are ready to move on to the next feature!

```run:command hidden=true cwd=super-rentals
yarn test
git add app/templates/application.hbs
git add app/templates/index.hbs
git add app/templates/contact.hbs
git add app/templates/about.hbs
```

```run:screenshot width=1024 height=512 retina=true filename=pass-5.png alt="Tests still passing with {{outlet}}"
visit http://localhost:4200/tests?nocontainer&deterministic
wait  #qunit-banner.qunit-pass
```

```run:server:stop
ember server
```

```run:checkpoint cwd=super-rentals
Chapter 4
```
