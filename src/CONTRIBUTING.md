# Contributing to the super-rentals-tutorial

TODO: add more info here!

## Formatting & Styleguide

* When naming chapters, be sure that they are prefixed with two digits before the chapter name to ensure that they are ordered correctly.
    * For example: `01-orientation.md`.
* When referring to filenames, be sure to specify the relatiive path to file. This is to make it easy to copy-paste the filename when people use the tutorial.
    * For example: *"Let's start by creating a new file at `app/components/jumbo.hbs`."*
* When referring to other chapters, link to the chapter using its relative path in the tutorial.
    * For example: `We learned about this in a [previous chapter](../02-building-pages/)`.
* When referring to important key terms, be sure to *italicize* the term and link to a definition for it.
    * For example: `*[route][http://a-great-link-to-the-definition-of-a-route-goes-here]*`.
* When referring to component names, keywords, helpers, or HTML elements, be sure to use code markup.
    * For example: *"Inside of this file, we have the `<NavBar>` component and the `{{outlet}}` keyword."*
* When using the "Zoey says" callouts, be sure to use the blockquote formatting, ensuring that an extra `>` is included between the "Zoey says..." text and the actual note content. This is required in order to properly convert the markdown into HTML.
    * For example:
        ```
        > Zoey says...
        >
        > Here's a very helpful comment!
        ```
