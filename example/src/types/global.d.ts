/** For SCSS files to be loaded into TS */
declare module '*.css' {
    const content: {[className: string]: string};
    export = content;
}
