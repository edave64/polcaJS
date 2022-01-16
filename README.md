# polca

Polca ("**pol**ish notation **ca**lculator") is an interactive programming environment and language. The polca language is functional and stack-based. While the most basic syntax seems to have stabilized, many of the built-in functions have not. Do *not* expect them to be unchanging.

## Basic calculations

If you are familiar with reverse polish notation (aka postfix notation), you can use polca as a caluclator immediately.

`1 2 + ` leaves you with a 3 on the stack. Think of it like this: "there is a 1, than there is a 2, then add". In this case *add* means that you take the two topmost things off the stack, then add them, then put the result back ontro the stack. This looks unusual at first, but it's very powerful. In polca, "+" is just a function. You just write functions in the order they are applied in. And you can write your own functions and use them just like the others!

Here is some other basic math functions you may want to play around with: `-` subtraction, `_` negation, `*` multiplication, `/` division, `%` modulo, `^` exponentiation. Oh, and `=`, `>` and `<` are just functions, too! Polca uses "0" and "1" as truth values.

# Deployment and contributing

## How to set up a local install

- Check out

- `npm install`

- `npm run watch` to run the typescript watcher, compiling the ts files

- The development version can be found in the `dist` folder 

## How to test

- `npm test`

- `npm run coverage` to see code coverage of these tests
