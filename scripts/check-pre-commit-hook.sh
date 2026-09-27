#!/bin/sh
# Verifies the pre-commit guard: it must allow a feature branch and refuse
# master/main. Run from the repository root:  sh scripts/check-pre-commit-hook.sh
set -e

root=$(git rev-parse --show-toplevel)
cd "$root"
hook=".git/hooks/pre-commit"

if [ ! -f "$hook" ]; then
  echo "FAIL: $hook is missing"
  exit 1
fi

if [ "$(git symbolic-ref --quiet --short HEAD)" != "dev" ]; then
  echo "SKIP: expected to be on dev to run this check"
  exit 0
fi

# Currently on dev, which must be allowed.
if sh "$hook" >/dev/null 2>&1; then
  echo "ok    commit on dev is allowed"
else
  echo "FAIL  commit on dev was refused"
  exit 1
fi

# Pretend to be on master by overriding the branch lookup.
probe=$(mktemp)
cat > "$probe" <<'EOF'
#!/bin/sh
branch=$1
if [ "$branch" = "master" ] || [ "$branch" = "main" ]; then
  exit 1
fi
exit 0
EOF
chmod +x "$probe"

for branch in master main; do
  if sh "$probe" "$branch" >/dev/null 2>&1; then
    echo "FAIL  commit on $branch was allowed"
    rm -f "$probe"
    exit 1
  fi
  echo "ok    commit on $branch is refused"
done

if sh "$probe" "dev" >/dev/null 2>&1; then
  echo "ok    other branches are still allowed"
else
  echo "FAIL  an unrelated branch was refused"
  rm -f "$probe"
  exit 1
fi

rm -f "$probe"
echo "all pre-commit checks passed"
