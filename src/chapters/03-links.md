Actually, there is one more thing. We just put so much effort into making these pages, so we need to make sure that people can find them! The way we do that on the web is by using hyperlinks.

Since Ember offers great support for URLs out-of-the-box, we _could_ just link our pages together using the `<a>` tag with the appropriate `href`. However, clicking on those links would require the browser to make a *[full-page refresh](TODO: link to full page refresh)*, which means that it would have to make a trip back to the server to fetch the page, and then load everything from scratch again.

With Ember, we can do better than that! Instead of the plain-old `<a>` tag, Ember provides an alternative called `<LinkTo>`. For example, here is how you would use it on the pages we just created:

```run:file:patch lang=handlebars cwd=super-rentals filename=app/templates/index.hbs
--- a/app/templates/index.hbs
+++ b/app/templates/index.hbs
@@ -4,2 +4,3 @@
   <p>We hope you find exactly what you're looking for in a place to stay.</p>
+  <LinkTo @route="about" class="button">About Us</LinkTo>
 </div>
```

```run:file:patch lang=handlebars cwd=super-rentals filename=app/templates/about.hbs
--- a/app/templates/about.hbs
+++ b/app/templates/about.hbs
@@ -8,2 +8,3 @@
   </p>
+  <LinkTo @route="contact" class="button">Contact Us</LinkTo>
 </div>
```

```run:file:patch lang=handlebars cwd=super-rentals filename=app/templates/contact.hbs
--- a/app/templates/contact.hbs
+++ b/app/templates/contact.hbs
@@ -16,2 +16,3 @@
   </address>
+  <LinkTo @route="about" class="button">About</LinkTo>
 </div>
```

There is quite a bit going on here, so let's break it down.

`<LinkTo>` is an example of a *[component](TODO: link to component)* in Ember &mdash; you can tell them apart from regular HTML tags because they start with an uppercase letter. Along with regular HTML tags, components are a key building block that we can use to build up an app's user interface.

We have a lot more to say about components later, but for now, you can think of them as a way to provide *[custom tags](TODO: link to custom tags)* to supplement the built-in ones that came with the browser.

The `@route=...` part is how we pass *[arguments](TODO: link to arguments)* into the component. Here, we use this to specify _which_ route we want to link to. Note that this should be the _name_ of the route, not the path, which is why we specified `"about"` instead of `"/about"`, and `"contact"` instead of `"/getting-in-touch"`.

In addition to arguments, components can also take the usual HTML attributes as well. In our example, we added a `"button"` class for styling purposes, but we could also specify other attributes as we see fit, such as the [ARIA](TODO: link to ARIA roles) `role` attribute. These are passed without the `@` symbol (`class=...` as opposed to `@class=...`), so that Ember will know they are just regular HTML attributes.

Under the hood, the `<LinkTo>` component generates a regular `<a>` tag for us with the appropriate `href` for the specific route. This allows for perfect interoperability for all screen readers, as well as the ability for our users to bookmark the link or open it in a new tab.

However, when clicking on one of these special links, Ember will intercept the click, render the content for the new page, and update the URL &mdash; all performed locally without having to wait for the server, thus avoiding a full page refresh.

```run:command hidden=true cwd=super-rentals
git add app/templates/index.hbs
git add app/templates/about.hbs
git add app/templates/contact.hbs
```

We will learn more about how all of this works soon. In the meantime, go ahead and click on the link in the browser. Did you notice how snappy that was? You'll see that we no longer have to change the URL (hooray!).

```run:checkpoint cwd=super-rentals
Chapter 3
```
