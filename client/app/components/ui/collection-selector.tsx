import { COLLECTIONS, CollectionType } from "../../lib/constants";

interface CollectionSelectorProps {
  selectedCollection: CollectionType;
  onCollectionChange: (collection: CollectionType) => void;
}

// Adventurers first (default), then Beasts
const COLLECTION_ORDER: CollectionType[] = ["adventurers", "beasts"];

export default function CollectionSelector({
  selectedCollection,
  onCollectionChange,
}: CollectionSelectorProps) {
  const collections = COLLECTION_ORDER.map((id) => COLLECTIONS[id]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70">
        Collection
      </label>
      <div className="flex flex-col gap-2">
        {collections.map((collection) => {
          const isSelected = selectedCollection === collection.id;
          return (
            <button
              key={collection.id}
              type="button"
              onClick={() => onCollectionChange(collection.id)}
              className={`group flex w-full items-center gap-2.5 rounded-full border px-4 py-2 text-left text-xs font-orbitron uppercase tracking-[0.14em] transition-all duration-200 hover:cursor-pointer ${
                isSelected
                  ? "border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/15 text-[rgb(50,255,52)]"
                  : "border-[rgb(50,255,52)]/30 bg-transparent text-[rgb(186,255,188)]/70 hover:border-[rgb(50,255,52)]/60 hover:text-[rgb(186,255,188)]"
              }`}
            >
              <span
                className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-[rgb(50,255,52)]"
                    : "border-[rgb(186,255,188)]/40 group-hover:border-[rgb(186,255,188)]/60"
                }`}
              >
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-[rgb(50,255,52)]" />
                )}
              </span>
              {collection.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
