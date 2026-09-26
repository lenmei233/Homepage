// Path: src/components/tools/nbt/NbtTreeView.tsx
//
// The recursive tree: renders the currently expanded part of the document,
// walking the real tree with a path so every row's actions can address the tag
// they belong to.
//
// Two consequences of path-addressing worth stating:
//   * a compound child's path segment is its NAME, so renaming a key moves that
//     subtree to a new path; its old expansion entry becomes irrelevant and the
//     subtree renders collapsed. Nothing is cached, so nothing goes stale.
//   * list items are addressed by INDEX, so deleting one shifts the paths of the
//     items after it. Expansion state follows the index, which is the same thing
//     the wire format does.
//
// The only change from the original is the wrapper's class: the tree is placed
// inside the tool's scrollable glass panel (`.nbt-treewrap`) instead of owning
// the whole page height.

import type { JsDocument, Tag, ValueTagType } from './types/nbt';
import { pathKey, type Path } from './lib/treeEdits';
import { t } from './i18n';
import { useNbtStore } from './store/nbtStore';
import TagRow from './TagRow';

interface NbtTreeViewProps {
  document: JsDocument;
}

const ROOT_PATH: Path = [];

export default function NbtTreeView({ document }: NbtTreeViewProps) {
  const expanded = useNbtStore((state) => state.expanded);
  const fieldError = useNbtStore((state) => state.fieldError);
  const toggleExpanded = useNbtStore((state) => state.toggleExpanded);
  const setTagAt = useNbtStore((state) => state.setTagAt);
  const addChild = useNbtStore((state) => state.addChild);
  const renameChild = useNbtStore((state) => state.renameChild);
  const deleteChild = useNbtStore((state) => state.deleteChild);
  const addItem = useNbtStore((state) => state.addItem);
  const addItemOfType = useNbtStore((state) => state.addItemOfType);
  const deleteItem = useNbtStore((state) => state.deleteItem);
  const renameRootTag = useNbtStore((state) => state.renameRootTag);

  const isExpanded = (path: Path): boolean => expanded[pathKey(path)] === true;

  /**
   * Routes an "add" action to the right edit for the container it came from.
   *
   * A compound takes a new named entry of the chosen type. A list takes a new
   * item: of the chosen type when it is empty (which is also how its element type
   * gets declared), otherwise of the element type it already holds.
   */
  const makeAddHandler = (tag: Tag, path: Path) => (type: ValueTagType) => {
    if (tag.type === 'list') {
      if (tag.value.length === 0) {
        addItemOfType(path, type);
      } else {
        addItem(path);
      }
      return;
    }
    addChild(path, type);
  };

  /** Renders the children of `tag` (which sits at `path`) at the given depth. */
  const renderChildren = (tag: Tag, path: Path, depth: number) => {
    if (!isExpanded(path)) {
      return null;
    }
    if (tag.type === 'compound') {
      return tag.value.map((entry, index) => {
        const childPath: Path = [...path, entry.name];
        return (
          <div key={pathKey(childPath)}>
            <TagRow
              name={entry.name}
              tag={entry.tag}
              path={childPath}
              depth={depth}
              renamable
              expanded={isExpanded(childPath)}
              onToggleExpanded={() => toggleExpanded(childPath)}
              onRename={(name) => renameChild(path, index, name)}
              onCommitValue={(next) => setTagAt(childPath, next)}
              onAddChild={makeAddHandler(entry.tag, childPath)}
              onDelete={() => deleteChild(path, index)}
              fieldError={fieldError}
            />
            {renderChildren(entry.tag, childPath, depth + 1)}
          </div>
        );
      });
    }
    if (tag.type === 'list') {
      return tag.value.map((item, index) => {
        const childPath: Path = [...path, index];
        return (
          <div key={pathKey(childPath)}>
            <TagRow
              name={`[${index}]`}
              tag={item}
              path={childPath}
              depth={depth}
              /* Items have no key on the wire, so only their value is editable. */
              renamable={false}
              expanded={isExpanded(childPath)}
              onToggleExpanded={() => toggleExpanded(childPath)}
              onRename={() => undefined}
              onCommitValue={(next) => setTagAt(childPath, next)}
              onAddChild={makeAddHandler(item, childPath)}
              onDelete={() => deleteItem(path, index)}
              fieldError={fieldError}
            />
            {renderChildren(item, childPath, depth + 1)}
          </div>
        );
      });
    }
    return null;
  };

  const root = document.root;

  return (
    <div className="nbt-tree">
      <TagRow
        name={root.name}
        tag={root.tag}
        path={ROOT_PATH}
        depth={0}
        /* The root's name is an ordinary key; renaming it is a normal edit. */
        renamable
        deletable={false}
        expanded={isExpanded(ROOT_PATH)}
        onToggleExpanded={() => toggleExpanded(ROOT_PATH)}
        onRename={renameRootTag}
        onCommitValue={(next) => setTagAt(ROOT_PATH, next)}
        onAddChild={makeAddHandler(root.tag, ROOT_PATH)}
        onDelete={() => undefined}
        fieldError={fieldError}
      />
      {renderChildren(root.tag, ROOT_PATH, 1)}
      {root.tag.type !== 'compound' && root.tag.type !== 'list' ? (
        <p className="nbt-drop-hint">
          {t('tools.nbt-editor.root.single', root.tag.type)}
        </p>
      ) : null}
    </div>
  );
}
