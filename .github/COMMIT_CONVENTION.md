# Commit Convention

This project follows the Conventional Commits specification for commit messages.

## Commit Message Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Required Elements

1. Commit messages must start with:
   `<type>[optional scope]: <description>`

2. Main types:

   - `feat`: Add new features (SEMVER MINOR)
   - `fix`: Fix bugs (SEMVER PATCH)
   - Other examples: `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`

3. For Breaking Changes:
   - Add `!` after type: `feat!: xxxx`
   - Or add `BREAKING CHANGE: ` in the footer

## Commit Message Examples

```
feat: add config object extension feature

BREAKING CHANGE: the `extends` key in config files is now used for extending other config files
```

```
fix: prevent request racing

Introduce request ID and reference to latest request.
Discard responses from requests other than the latest.

Refs: #123
```

```
docs: fix spelling in CHANGELOG
```

```
feat(lang): add English support
```

## Rules for Writing Commit Messages

1. Use present tense ("add feature" not "added feature")
2. Use imperative mood ("move cursor to..." not "moves cursor to...")
3. Limit the first line to 72 characters or less
4. Reference issues and pull requests liberally after the first line

## Type Categories

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools
- `ci`: Changes to CI configuration files and scripts
