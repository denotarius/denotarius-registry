module.exports = {
  name: 'yarn-plugin-nixify',
  factory: function (e) {
    var t;
    return (
      (() => {
        'use strict';
        var n = {
            d: (e, t) => {
              for (var o in t)
                n.o(t, o) &&
                  !n.o(e, o) &&
                  Object.defineProperty(e, o, { enumerable: !0, get: t[o] });
            },
            o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
            r: e => {
              'undefined' != typeof Symbol &&
                Symbol.toStringTag &&
                Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
                Object.defineProperty(e, '__esModule', { value: !0 });
            },
          },
          o = {};
        n.r(o), n.d(o, { default: () => w });
        const i = e('@yarnpkg/core'),
          r = e('clipanion');
        class a extends r.Command {
          constructor(...e) {
            super(...e), (this.locator = r.Option.String());
          }
          async execute() {
            const e = await i.Configuration.find(this.context.cwd, this.context.plugins),
              { project: t } = await i.Project.find(e, this.context.cwd),
              n = await i.Cache.find(e),
              o = e.makeFetcher();
            return (
              await i.StreamReport.start(
                { configuration: e, stdout: this.context.stdout },
                async e => {
                  const { locatorHash: r } = i.structUtils.parseLocator(this.locator, !0),
                    a = t.originalPackages.get(r);
                  a
                    ? await o.fetch(a, {
                        checksums: t.storedChecksums,
                        project: t,
                        cache: n,
                        fetcher: o,
                        report: e,
                      })
                    : e.reportError(0, 'Invalid locator');
                },
              )
            ).exitCode();
          }
        }
        a.paths = [['nixify', 'fetch-one']];
        const s = e('@yarnpkg/fslib'),
          c = e('crypto');
        class l extends r.Command {
          constructor(...e) {
            super(...e),
              (this.locator = r.Option.String()),
              (this.source = r.Option.String()),
              (this.installLocation = r.Option.String());
          }
          async execute() {
            const e = await i.Configuration.find(this.context.cwd, this.context.plugins),
              { project: t } = await i.Project.find(e, this.context.cwd);
            return (
              await t.restoreInstallState({ restoreResolutions: !1 }),
              (
                await i.StreamReport.start(
                  { configuration: e, stdout: this.context.stdout },
                  async n => {
                    await t.resolveEverything({ report: n, lockfileOnly: !0 });
                    const o = i.structUtils.parseLocator(this.locator, !0),
                      r = t.storedPackages.get(o.locatorHash);
                    if (!r) return void n.reportError(0, 'Invalid locator');
                    const a = s.ppath.join(t.cwd, this.installLocation);
                    await s.xfs.mkdirpPromise(s.ppath.dirname(a)),
                      await i.execUtils.execvp('cp', ['-R', this.source, a], {
                        cwd: t.cwd,
                        strict: !0,
                      }),
                      await i.execUtils.execvp('chmod', ['-R', 'u+w', a], {
                        cwd: t.cwd,
                        strict: !0,
                      });
                    const l = (0, c.createHash)('sha512');
                    l.update(process.versions.node),
                      e.triggerHook(
                        e => e.globalHashGeneration,
                        t,
                        e => {
                          l.update('\0'), l.update(e);
                        },
                      );
                    const d = l.digest('hex'),
                      p = new Map(),
                      h = e => {
                        let n = p.get(e.locatorHash);
                        if (void 0 !== n) return n;
                        const o = t.storedPackages.get(e.locatorHash);
                        if (void 0 === o)
                          throw new Error(
                            'Assertion failed: The package should have been registered',
                          );
                        const r = (0, c.createHash)('sha512');
                        r.update(e.locatorHash), p.set(e.locatorHash, '<recursive>');
                        for (const e of o.dependencies.values()) {
                          const n = t.storedResolutions.get(e.descriptorHash);
                          if (void 0 === n)
                            throw new Error(
                              `Assertion failed: The resolution (${i.structUtils.prettyDescriptor(
                                t.configuration,
                                e,
                              )}) should have been registered`,
                            );
                          const o = t.storedPackages.get(n);
                          if (void 0 === o)
                            throw new Error(
                              'Assertion failed: The package should have been registered',
                            );
                          r.update(h(o));
                        }
                        return (n = r.digest('hex')), p.set(e.locatorHash, n), n;
                      },
                      u = (0, c.createHash)('sha512')
                        .update(d)
                        .update(h(r))
                        .update(a)
                        .digest('hex');
                    t.storedBuildState.set(r.locatorHash, u), await t.persistInstallStateFile();
                  },
                )
              ).exitCode()
            );
          }
        }
        l.paths = [['nixify', 'inject-build']];
        const d = e('@yarnpkg/plugin-pnp'),
          p = JSON.stringify,
          h = (e, t, n = !1) =>
            t
              .split('\n')
              .map(t => (t || n ? e + t : t))
              .join('\n'),
          u = (e, t) => {
            let n = e;
            for (const [e, o] of Object.entries(t))
              if (('string' == typeof o && (n = n.replace(`@@${e}@@`, o)), 'boolean' == typeof o)) {
                const t = n.split('\n'),
                  i = t.indexOf(`#@@ IF ${e}`),
                  r = t.indexOf(`#@@ ENDIF ${e}`);
                -1 !== i &&
                  r > i &&
                  (o ? (t.splice(r, 1), t.splice(i, 1)) : t.splice(i, r - i + 1),
                  (n = t.join('\n')));
              }
            return n;
          };
        class f extends r.Command {
          constructor(...e) {
            super(...e), (this.binDir = r.Option.String());
          }
          async execute() {
            const e = await i.Configuration.find(this.context.cwd, this.context.plugins),
              { project: t, workspace: n } = await i.Project.find(e, this.context.cwd);
            return (
              await i.StreamReport.start(
                { configuration: e, stdout: this.context.stdout },
                async o => {
                  if (!n) return;
                  const r = s.npath.toPortablePath(this.binDir);
                  for (const [o, i] of n.manifest.bin) {
                    const n = s.ppath.join(r, o),
                      a = s.ppath.join(t.cwd, s.npath.toPortablePath(i));
                    await this.writeWrapper(n, a, { configuration: e, project: t });
                  }
                  if (e.get('installNixBinariesForDependencies')) {
                    await t.resolveEverything({ report: o, lockfileOnly: !0 });
                    const n = await i.scriptUtils.getPackageAccessibleBinaries(
                      t.topLevelWorkspace.anchoredLocator,
                      { project: t },
                    );
                    for (const [o, [i, a]] of n.entries()) {
                      const n = s.ppath.join(r, o);
                      await this.writeWrapper(n, s.npath.toPortablePath(a), {
                        configuration: e,
                        project: t,
                      });
                    }
                  }
                },
              )
            ).exitCode();
          }
          async writeWrapper(e, t, { configuration: n, project: o }) {
            let i;
            switch (n.get('nodeLinker')) {
              case 'pnp':
                i = u(
                  '#!/bin/sh\nexport NODE_OPTIONS="--require @@PNP_PATH@@"\nexec \'@@NODE_PATH@@\' \'@@BINARY_PATH@@\' "$@"\n',
                  {
                    NODE_PATH: process.execPath,
                    PNP_PATH: (0, d.getPnpPath)(o).cjs,
                    BINARY_PATH: t,
                  },
                );
                break;
              case 'node-modules':
                i = u("#!/bin/sh\nexec '@@NODE_PATH@@' '@@BINARY_PATH@@' \"$@\"\n", {
                  NODE_PATH: process.execPath,
                  BINARY_PATH: t,
                });
                break;
              default:
                throw Error('Assertion failed: Invalid nodeLinker');
            }
            await s.xfs.writeFilePromise(e, i), await s.xfs.chmodPromise(e, 493);
          }
        }
        f.paths = [['nixify', 'install-bin']];
        const g = e('@yarnpkg/plugin-patch'),
          m = (e, t) => (0, c.createHash)(e).update(t).digest(),
          y = (e, t, n, o = '/nix/store') => {
            const i = n.toString('hex'),
              r = m('sha256', `fixed:out:${t}:${i}:`).toString('hex'),
              a = (e => {
                let t = '',
                  n = [...e]
                    .reverse()
                    .map(e => e.toString(2).padStart(8, '0'))
                    .join('');
                for (; n; )
                  (t += '0123456789abcdfghijklmnpqrsvwxyz'[parseInt(n.slice(0, 5), 2)]),
                    (n = n.slice(5));
                return t;
              })(
                ((e, t) => {
                  const n = Buffer.alloc(20);
                  for (let t = 0; t < e.length; t++) n[t % 20] ^= e[t];
                  return n;
                })(m('sha256', `output:out:sha256:${r}:${o}:${e}`)),
              );
            return s.ppath.join(o, `${a}-${e}`);
          },
          x = e =>
            e
              .replace(/^\.+/, '')
              .replace(/[^a-zA-Z0-9+._?=-]+/g, '-')
              .slice(0, 207) || 'unknown',
          v = e('os'),
          b = {
            commands: [a, l, f],
            hooks: {
              afterAllInstalled: async (e, t) => {
                !1 !== t.persistProject &&
                  e.configuration.get('enableNixify') &&
                  (await (async (e, t, n) => {
                    const { configuration: o, cwd: r } = e,
                      a = await s.xfs.realpathPromise(s.npath.toPortablePath((0, v.tmpdir)()));
                    if (e.cwd.startsWith(a))
                      return void n.reportInfo(
                        0,
                        `Skipping Nixify, because ${e.cwd} appears to be a temporary directory`,
                      );
                    const c = o.get('yarnPath');
                    let l = s.ppath.relative(r, c);
                    l.startsWith('../') &&
                      ((l = c),
                      n.reportWarning(
                        0,
                        `The Yarn path ${c} is outside the project - it may not be reachable by the Nix build`,
                      ));
                    const d = o.get('cacheFolder');
                    let f = s.ppath.relative(r, d);
                    f.startsWith('../') &&
                      ((f = d),
                      n.reportWarning(
                        0,
                        `The cache folder ${d} is outside the project - it may not be reachable by the Nix build`,
                      ));
                    for (const e of o.sources.values())
                      e.startsWith('<') ||
                        (s.ppath.relative(r, e).startsWith('../') &&
                          n.reportWarning(
                            0,
                            `The config file ${e} is outside the project - it may not be reachable by the Nix build`,
                          ));
                    const m = o.get('nixExprPath'),
                      b = o.get('lockfileFilename'),
                      w = s.ppath.relative(s.ppath.dirname(m), b),
                      P = s.ppath.relative(s.ppath.dirname(m), l),
                      k = new Map(),
                      $ = new Set(await s.xfs.readdirPromise(t.cwd)),
                      T = { unstablePackages: e.conditionalLocators };
                    for (const n of e.storedPackages.values()) {
                      const { locatorHash: o } = n,
                        r = e.storedChecksums.get(o),
                        a = t.getLocatorPath(n, r || null, T);
                      if (!a) continue;
                      const c = s.ppath.basename(a);
                      if (!$.has(c)) continue;
                      const l = i.structUtils.stringifyLocator(n),
                        d = r ? r.split('/').pop() : await i.hashUtils.checksumFile(a);
                      k.set(l, { filename: c, sha512: d });
                    }
                    let E = 'cacheEntries = {\n';
                    for (const [e, t] of k)
                      E += `${p(e)} = { ${[
                        `filename = ${p(t.filename)};`,
                        `sha512 = ${p(t.sha512)};`,
                      ].join(' ')} };\n`;
                    E += '};';
                    const A = o.get('isolatedNixBuilds');
                    let N = new Set(),
                      j = [],
                      I = [];
                    const O = o.get('nodeLinker'),
                      S = o.get('pnpUnpluggedFolder'),
                      _ = (t, n = new Set()) => {
                        const o = i.structUtils.stringifyLocator(t);
                        if ((k.has(o) && n.add(o), i.structUtils.isVirtualLocator(t))) {
                          const o = e.storedPackages.get(
                            i.structUtils.devirtualizeLocator(t).locatorHash,
                          );
                          if (!o)
                            throw Error(
                              'Assertion failed: The locator should have been registered',
                            );
                          _(o, n);
                        }
                        if (t.reference.startsWith('patch:')) {
                          const o = e.storedPackages.get(
                            g.patchUtils.parseLocator(t).sourceLocator.locatorHash,
                          );
                          if (!o)
                            throw Error(
                              'Assertion failed: The locator should have been registered',
                            );
                          _(o, n);
                        }
                        for (const o of t.dependencies.values()) {
                          const t = e.storedResolutions.get(o.descriptorHash);
                          if (!t)
                            throw Error(
                              'Assertion failed: The descriptor should have been registered',
                            );
                          const i = e.storedPackages.get(t);
                          if (!i)
                            throw Error(
                              'Assertion failed: The locator should have been registered',
                            );
                          _(i, n);
                        }
                        return n;
                      };
                    for (const t of e.storedBuildState.keys()) {
                      const n = e.storedPackages.get(t);
                      if (!n)
                        throw Error('Assertion failed: The locator should have been registered');
                      if (!A.includes(n.name)) continue;
                      let o;
                      if ('pnp' !== O)
                        throw Error(`The nodeLinker ${O} is not supported for isolated Nix builds`);
                      o = s.ppath.relative(
                        e.cwd,
                        s.ppath.join(
                          S,
                          i.structUtils.slugifyLocator(n),
                          i.structUtils.getIdentVendorPath(n),
                        ),
                      );
                      let r = n;
                      if (i.structUtils.isVirtualLocator(r)) {
                        const { locatorHash: t } = i.structUtils.devirtualizeLocator(r),
                          n = e.storedPackages.get(t);
                        if (!n)
                          throw Error('Assertion failed: The locator should have been registered');
                        r = n;
                      }
                      const a = i.structUtils.stringifyLocator(r),
                        c = i.structUtils.stringifyLocator(n),
                        l = `isolated.${p(a)}`;
                      if (!N.has(r)) {
                        N.add(r);
                        const e = [..._(n)]
                            .sort()
                            .map(e => `${p(e)}\n`)
                            .join(''),
                          t = `override${
                            ((L = n.name),
                            L.split(/[^a-zA-Z0-9]+/g)
                              .filter(e => e)
                              .map(e => {
                                return (t = e).slice(0, 1).toUpperCase() + t.slice(1);
                                var t;
                              })
                              .join(''))
                          }Attrs`;
                        I.push(
                          `${l} = optionalOverride (args.${t} or null) (mkIsolatedBuild { ${[
                            `pname = ${p(n.name)};`,
                            `version = ${p(n.version)};`,
                            `reference = ${p(r.reference)};`,
                            `locators = [\n${e}];`,
                          ].join(' ')} });`,
                        );
                      }
                      0 === j.length && j.push('# Copy in isolated builds.'),
                        j.push(
                          `echo 'injecting build for ${n.name}'`,
                          'yarn nixify inject-build \\',
                          `  ${p(c)} \\`,
                          `  \${${l}} \\`,
                          `  ${p(o)}`,
                        );
                    }
                    var L;
                    j.length > 0 && j.push("echo 'running yarn install'");
                    const C = e.topLevelWorkspace.manifest.name,
                      H = C ? i.structUtils.stringifyIdent(C) : 'workspace',
                      D = u(
                        '# This file is generated by running "yarn install" inside your project.\n# Manual changes might be lost - proceed with caution!\n\n{ lib, nodejs, stdenv, fetchurl, writeText, git, cacert }:\n{ src, overrideAttrs ? null, ... } @ args:\n\nlet\n\n  yarnPath = ./@@YARN_PATH@@;\n  lockfile = ./@@LOCKFILE@@;\n  cacheFolder = @@CACHE_FOLDER@@;\n\n  # Call overrideAttrs on a derivation if a function is provided.\n  optionalOverride = fn: drv:\n    if fn == null then drv else drv.overrideAttrs fn;\n\n  # Common attributes between Yarn derivations.\n  drvCommon = {\n    # Make sure the build uses the right Node.js version everywhere.\n    buildInputs = [ nodejs ];\n    # Tell node-gyp to use the provided Node.js headers for native code builds.\n    npm_config_nodedir = nodejs;\n    # Tell node-pre-gyp to never fetch binaries / always build from source.\n    npm_config_build_from_source = "true";\n    # Defines the shell alias to run Yarn.\n    postHook = \'\'\n      yarn() {\n        CI=1 node "${yarnPath}" "$@"\n      }\n    \'\';\n  };\n\n  # Create derivations for fetching dependencies.\n  cacheDrvs = let\n    builder = builtins.toFile "builder.sh" \'\'\n      source $stdenv/setup\n      cd "$src"\n      HOME="$TMP" yarn_cache_folder="$TMP" CI=1 \\\n        node \'${yarnPath}\' nixify fetch-one $locator\n      # Because we change the cache dir, Yarn may generate a different name.\n      mv "$TMP/$(sed \'s/-[^-]*\\.[^-]*$//\' <<< "$outputFilename")"-* $out\n    \'\';\n  in lib.mapAttrs (locator: { filename, sha512 }: stdenv.mkDerivation {\n    inherit src builder locator;\n    name = lib.strings.sanitizeDerivationName locator;\n    buildInputs = [ nodejs git cacert ];\n    outputFilename = filename;\n    outputHashMode = "flat";\n    outputHashAlgo = "sha512";\n    outputHash = sha512;\n  }) cacheEntries;\n\n  # Create a shell snippet to copy dependencies from a list of derivations.\n  mkCacheBuilderForDrvs = drvs:\n    writeText "collect-cache.sh" (lib.concatMapStrings (drv: \'\'\n      cp ${drv} \'${drv.outputFilename}\'\n    \'\') drvs);\n\n#@@ IF NEED_ISOLATED_BUILD_SUPPRORT\n  # Create a shell snippet to copy dependencies from a list of locators.\n  mkCacheBuilderForLocators = let\n    pickCacheDrvs = map (locator: cacheDrvs.${locator});\n  in locators:\n    mkCacheBuilderForDrvs (pickCacheDrvs locators);\n\n  # Create a derivation that builds a node-pre-gyp module in isolation.\n  mkIsolatedBuild = { pname, version, reference, locators }: stdenv.mkDerivation (drvCommon // {\n    inherit pname version;\n    phases = [ "buildPhase" "installPhase" ];\n\n    buildPhase = \'\'\n      mkdir -p .yarn/cache\n      pushd .yarn/cache > /dev/null\n      source ${mkCacheBuilderForLocators locators}\n      popd > /dev/null\n\n      echo \'{ "dependencies": { "${pname}": "${reference}" } }\' > package.json\n      install -m 0600 ${lockfile} ./yarn.lock\n      export yarn_global_folder="$TMP"\n      export YARN_ENABLE_IMMUTABLE_INSTALLS=false\n      yarn --immutable-cache\n    \'\';\n\n    installPhase = \'\'\n      unplugged=( .yarn/unplugged/${pname}-*/node_modules/* )\n      if [[ ! -e "\'\'${unplugged[@]}" ]]; then\n        echo >&2 "Could not find the unplugged path for ${pname}"\n        exit 1\n      fi\n\n      mv "$unplugged" $out\n    \'\';\n  });\n#@@ ENDIF NEED_ISOLATED_BUILD_SUPPRORT\n\n  # Main project derivation.\n  project = stdenv.mkDerivation (drvCommon // {\n    inherit src;\n    name = @@PROJECT_NAME@@;\n    # Disable Nixify plugin to save on some unnecessary processing.\n    yarn_enable_nixify = "false";\n\n    configurePhase = \'\'\n      # Copy over the Yarn cache.\n      rm -fr \'${cacheFolder}\'\n      mkdir -p \'${cacheFolder}\'\n      pushd \'${cacheFolder}\' > /dev/null\n      source ${mkCacheBuilderForDrvs (lib.attrValues cacheDrvs)}\n      popd > /dev/null\n\n      # Yarn may need a writable home directory.\n      export yarn_global_folder="$TMP"\n\n      # Some node-gyp calls may call out to npm, which could fail due to an\n      # read-only home dir.\n      export HOME="$TMP"\n\n      # running preConfigure after the cache is populated allows for\n      # preConfigure to contain substituteInPlace for dependencies as well as the\n      # main project. This is necessary for native bindings that maybe have\n      # hardcoded values.\n      runHook preConfigure\n\n@@ISOLATED_INTEGRATION@@\n\n      # Run normal Yarn install to complete dependency installation.\n      yarn install --immutable --immutable-cache\n\n      runHook postConfigure\n    \'\';\n\n    buildPhase = \'\'\n      runHook preBuild\n      runHook postBuild\n    \'\';\n\n    installPhase = \'\'\n      runHook preInstall\n\n      mkdir -p $out/libexec $out/bin\n\n      # Move the entire project to the output directory.\n      mv $PWD "$out/libexec/$sourceRoot"\n      cd "$out/libexec/$sourceRoot"\n\n      # Invoke a plugin internal command to setup binaries.\n      yarn nixify install-bin $out/bin\n\n      runHook postInstall\n    \'\';\n\n    passthru = {\n      inherit nodejs;\n    };\n  });\n\n@@CACHE_ENTRIES@@\n@@ISOLATED@@\nin optionalOverride overrideAttrs project\n',
                        {
                          PROJECT_NAME: p(H),
                          YARN_PATH: P,
                          LOCKFILE: w,
                          CACHE_FOLDER: p(f),
                          CACHE_ENTRIES: E,
                          ISOLATED: I.join('\n'),
                          ISOLATED_INTEGRATION: h('      ', j.join('\n')),
                          NEED_ISOLATED_BUILD_SUPPRORT: j.length > 0,
                        },
                      );
                    if (
                      (await s.xfs.writeFilePromise(o.get('nixExprPath'), D),
                      o.get('generateDefaultNix'))
                    ) {
                      const e = s.ppath.join(r, 'default.nix'),
                        t = s.ppath.join(r, 'flake.nix');
                      s.xfs.existsSync(e) ||
                        s.xfs.existsSync(t) ||
                        (await s.xfs.writeFilePromise(
                          e,
                          '# This is a minimal `default.nix` by yarn-plugin-nixify. You can customize it\n# as needed, it will not be overwritten by the plugin.\n\n{ pkgs ? import <nixpkgs> { } }:\n\npkgs.callPackage ./yarn-project.nix { } { src = ./.; }\n',
                        ),
                        n.reportInfo(
                          0,
                          'A minimal default.nix was created. You may want to customize it.',
                        ));
                    }
                    o.get('enableNixPreload') &&
                      s.xfs.existsSync(s.npath.toPortablePath('/nix/store')) &&
                      (await s.xfs.mktempPromise(async o => {
                        const r = [];
                        for (const [e, { filename: n, sha512: i }] of k.entries()) {
                          const a = x(e),
                            c = Buffer.from(i, 'hex'),
                            l = y(a, 'sha512', c);
                          if (!s.xfs.existsSync(l)) {
                            const e = s.ppath.join(o, i.slice(0, 7));
                            await s.xfs.mkdirPromise(e);
                            const c = s.ppath.join(t.cwd, n),
                              l = s.ppath.join(e, a);
                            await s.xfs.copyFilePromise(c, l), r.push(l);
                          }
                        }
                        try {
                          const t = r.length;
                          for (; 0 !== r.length; ) {
                            const t = r.splice(0, 100);
                            await i.execUtils.execvp('nix-store', ['--add-fixed', 'sha512', ...t], {
                              cwd: e.cwd,
                              strict: !0,
                            });
                          }
                          0 !== t && n.reportInfo(0, `Preloaded ${t} packages into the Nix store`);
                        } catch (e) {
                          if ('ENOENT' !== e.code) throw e;
                        }
                      }));
                  })(e, t.cache, t.report));
              },
            },
            configuration: {
              enableNixify: {
                description:
                  'If false, disables the Nixify plugin hook that generates Nix expressions',
                type: i.SettingsType.BOOLEAN,
                default: !0,
              },
              nixExprPath: {
                description: 'Path of the file where the project Nix expression will be written to',
                type: i.SettingsType.ABSOLUTE_PATH,
                default: './yarn-project.nix',
              },
              generateDefaultNix: {
                description: 'If true, a default.nix will be generated if it does not exist',
                type: i.SettingsType.BOOLEAN,
                default: !0,
              },
              enableNixPreload: {
                description: 'If true, cached packages will be preloaded into the Nix store',
                type: i.SettingsType.BOOLEAN,
                default: !0,
              },
              isolatedNixBuilds: {
                description:
                  'Dependencies with a build step that can be built in an isolated derivation',
                type: i.SettingsType.STRING,
                default: [],
                isArray: !0,
              },
              installNixBinariesForDependencies: {
                description:
                  "If true, the Nix output 'bin' directory will also contain executables for binaries defined by dependencies",
                type: i.SettingsType.BOOLEAN,
                default: !1,
              },
            },
          },
          w = b;
        t = o;
      })(),
      t
    );
  },
};
