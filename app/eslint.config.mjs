import globals from 'globals';
export default [
 {ignores:['node_modules/**','dist/**','release/**','native/**','data/**','qa/**','samples/**']},
 {files:['**/*.{js,jsx,mjs,cjs}'],languageOptions:{ecmaVersion:'latest',parserOptions:{ecmaFeatures:{jsx:true}},globals:{...globals.browser,...globals.node}},rules:{'no-unreachable':'error','no-dupe-args':'error','no-dupe-keys':'error','no-invalid-regexp':'error','no-unexpected-multiline':'error','valid-typeof':'error','constructor-super':'error','no-const-assign':'error','no-this-before-super':'error'}}
];
