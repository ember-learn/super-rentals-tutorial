```run:server:start hidden=true cwd=super-rentals expect="Serving on http://localhost:4200/"
ember server
```

In this chapter, you will build the first few pages of your Ember app and set up links between them. By the end of this chapter, you should have two new pages – an about page and a contact page. These pages will be linked to from your landing page:

![The Super Rentals app (homepage) by the end of the chapter](/screenshots/02-building-pages/index-with-link@2x.png)

![The Super Rentals app (about page) by the end of the chapter](/screenshots/02-building-pages/about-with-link@2x.png)

![The Super Rentals app (contact page) by the end of the chapter](/screenshots/02-building-pages/contact-with-link@2x.png)

While building these pages, you will learn about:

* Defining routes
* Using route templates
* Customizing URLs
* Linking pages with the `<LinkTo>` component
* Passing arguments and attributes to components

## Defining Routes

With our [first page](../01-orientation/) down, let's add another one!

This time, we would like the page to be served on the `/about` URL. In order to do this, we will need to tell Ember about our plan to add a page at that location. Otherwise, Ember will think we have visited an invalid URL!

The place to manage what pages are available is the *[router][TODO: link to router]*. Go ahead and open `app/router.js` and make the following change:

```run:file:patch lang=js cwd=super-rentals filename=app/router.js
@@ -9,2 +9,3 @@
 Router.map(function() {
+  this.route('about');
 });
```

This adds a *[route][TODO: link to route]* named "about", which is served at the `/about` URL by default.

```run:command hidden=true cwd=super-rentals
git add app/router.js
```

## Using Route Templates

With that in place, we can create a new `app/templates/about.hbs` template with the following content:

```run:file:create lang=handlebars cwd=super-rentals filename=app/templates/about.hbs
<div class="jumbo">
  <div class="right tomster"></div>
  <h2>About Super Rentals</h2>
  <p>
    The Super Rentals website is a delightful project created to explore Ember.
    By building a property rental site, we can simultaneously imagine traveling
    AND building Ember applications.
  </p>
</div>
```

To see this in action, navigate to `http://localhost:4200/about`.

```run:screenshot width=1024 retina=true filename=about.png alt="About page"
visit http://localhost:4200/about
```

```run:command hidden=true cwd=super-rentals
git add app/templates/about.hbs
```

With that, our second page is done!

## Defining Routes with Custom Paths

We're on a roll! While we're at it, let's add our third page. This time, things are a little bit different. Everyone at the company calls this the "contact" page. However, the old website we are replacing already has a similar page, which is served at the legacy URL `/getting-in-touch`.

We want to keep the existing URLs for the new website, but `getting-in-touch` is a mouthful to type and say out loud all the time! Fortunately, we can have the best of the both worlds:

```run:file:patch lang=js cwd=super-rentals filename=app/router.js
@@ -10,2 +10,3 @@
   this.route('about');
+  this.route('contact', { path: '/getting-in-touch' });
 });
```

Here, we added the `contact` route, but explicitly specified a path for the route. This allows us to keep the legacy URL, but use the new, shorter name for the route, as well as the template filename.

```run:command hidden=true cwd=super-rentals
git add app/router.js
```

Speaking of the template, let's create that as well. We'll add a `app/templates/contact.hbs` file:

```run:file:create lang=handlebars cwd=super-rentals filename=app/templates/contact.hbs
<div class="jumbo">
  <div class="right tomster"></div>
  <h2>Contact Us</h2>
  <p>
    Super Rentals Representatives would love to help you<br>
    choose a destination or answer any questions you may have.
  </p>
  <address>
    Super Rentals HQ
    <p>
      1212 Test Address Avenue<br>
      Testington, OR 97233
    </p>
    <a href="tel:503.555.1212">+1 (503) 555-1212</a><br>
    <a href="mailto:superrentalsrep@emberjs.com">superrentalsrep@emberjs.com</a>
  </address>
</div>
```

Ember comes with strong *[conventions][TODO: link to conventions]* and sensible defaults &mdash; if we were starting from scratch, we wouldn't mind the default `/contact` URL. However, if the defaults don't work for us, it is no problem at all to customize Ember for our needs!

Once you have added the route and the template above, we should have the new page available to us at `http://localhost:4200/getting-in-touch`.

```run:screenshot width=1024 retina=true filename=contact.png alt="Contact page"
visit http://localhost:4200/getting-in-touch
```

```run:command hidden=true cwd=super-rentals
git add app/templates/contact.hbs
```

## Linking Pages with the `<LinkTo>` Component

We just put so much effort into making these pages, we need to make sure people can find them! The way we do that on the web is by using *[hyperlinks][TODO: link to hyperlinks]*, or *links* for short.

Since Ember offers great support for URLs out-of-the-box, we _could_ just link our pages together using the `<a>` tag with the appropriate `href`. However, clicking on those links would require the browser to make a *[full-page refresh][TODO: link to full page refresh]*, which means that it would have to make a trip back to the server to fetch the page, and then load everything from scratch again.

With Ember, we can do better than that! Instead of the plain-old `<a>` tag, Ember provides an alternative called `<LinkTo>`. For example, here is how you would use it on the pages we just created:

```run:file:patch lang=handlebars cwd=super-rentals filename=app/templates/index.hbs
@@ -4,2 +4,3 @@
   <p>We hope you find exactly what you're looking for in a place to stay.</p>
+  <LinkTo @route="about" class="button">About Us</LinkTo>
 </div>
```

```run:file:patch lang=handlebars cwd=super-rentals filename=app/templates/about.hbs
@@ -8,2 +8,3 @@
   </p>
+  <LinkTo @route="contact" class="button">Contact Us</LinkTo>
 </div>
```

```run:file:patch lang=handlebars cwd=super-rentals filename=app/templates/contact.hbs
@@ -16,2 +16,3 @@
   </address>
+  <LinkTo @route="about" class="button">About</LinkTo>
 </div>
```

There is quite a bit going on here, so let's break it down.

`<LinkTo>` is an example of a *[component][TODO: link to component]* in Ember &mdash; you can tell them apart from regular HTML tags because they start with an uppercase letter. Along with regular HTML tags, components are a key building block that we can use to build up an app's user interface.

We have a lot more to say about components later, but for now, you can think of them as a way to provide *[custom tags][TODO: link to custom tags]* to supplement the built-in ones that came with the browser.

The `@route=...` part is how we pass *[arguments][TODO: link to arguments]* into the component. Here, we use this argument to specify _which_ route we want to link to. (Note that this should be the _name_ of the route, not the path, which is why we specified `"about"` instead of `"/about"`, and `"contact"` instead of `"/getting-in-touch"`.)

In addition to arguments, components can also take the usual HTML attributes as well. In our example, we added a `"button"` class for styling purposes, but we could also specify other attributes as we see fit, such as the [ARIA][TODO: link to ARIA] [`role` attribute][TODO: link to role attribute]. These are passed without the `@` symbol (`class=...` as opposed to `@class=...`), so that Ember will know they are just regular HTML attributes.

Under the hood, the `<LinkTo>` component generates a regular `<a>` tag for us with the appropriate `href` for the specific route. This allows for perfect interoperability for all *[screen readers][TODO: link to screen readers]*, as well as the ability for our users to bookmark the link or open it in a new tab.

However, when clicking on one of these special links, Ember will intercept the click, render the content for the new page, and update the URL &mdash; all performed locally without having to wait for the server, thus avoiding a full page refresh.

<!-- TODO: make this a gif instead -->

```run:screenshot width=1024 retina=true filename=index-with-link.png alt="Index page after adding the link"
visit http://localhost:4200/
```

```run:screenshot width=1024 retina=true filename=about-with-link.png alt="About page after adding the link"
visit http://localhost:4200/about
```

```run:screenshot width=1024 retina=true filename=contact-with-link.png alt="Contact page after adding the link"
visit http://localhost:4200/getting-in-touch
```

```run:command hidden=true cwd=super-rentals
git add app/templates/index.hbs
git add app/templates/about.hbs
git add app/templates/contact.hbs
```

We will learn more about how all of this works soon. In the meantime, go ahead and click on the link in the browser. Did you notice how snappy that was?

Congratulations, you are well on your way to becoming a master page-crafter!

```run:server:stop
ember server
```

```run:checkpoint cwd=super-rentals
Chapter 2
```
