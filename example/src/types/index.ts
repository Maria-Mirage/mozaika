export type Source = {
    url: string;
    width: number;
    height: number;
}

export type SourceSet = {
    original: string;
    set: Source[]
}

export type ImageSources = {
    /** The constructed source string */
    src: string;

    /** The constructed source set string */
    srcset: string;
};

export type Photo = {
    type: "portrait" | "landscape" | "square";
    id: string;
    nsfw: boolean;
    collaborators: {
        role: string;
        name: string;
    }[];
    theme: string[];
    keywords: string[];
    title: string;
    featuresIn: {
        mobile?: boolean | undefined;
        desktop?: boolean | undefined;
    };
    source: SourceSet,
    description?: string | undefined;
    updatedAt?: number | undefined;
}

export type PhotoResponse =
  | {
      status: true;
      data: { items: Photo[], from: string | null };
    }
  | { status: false; error: Error | unknown };
