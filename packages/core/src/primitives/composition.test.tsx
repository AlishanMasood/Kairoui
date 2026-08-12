/**
 * Primitive composition integration tests.
 *
 * Validates that all Phase 7 primitives compose cleanly together
 * in realistic layout patterns without conflicts.
 */
import { describe, it, expect, afterEach } from "vitest";
import { createRef } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Box,
  Text,
  Heading,
  Flex,
  Stack,
  Grid,
  Container,
  Surface,
  Divider,
  Spacer,
  Center,
  AspectRatio,
  VisuallyHidden,
  Icon,
} from "./index";

afterEach(cleanup);

// ─── Container + Stack ──────────────────────────────────────────────

describe("Composition: Container + Stack", () => {
  it("renders page layout pattern", () => {
    render(
      <Container data-testid="page" maxWidth="lg">
        <Stack data-testid="content" gap={24}>
          <Heading level={1}>Page Title</Heading>
          <Text as="p">Body text paragraph.</Text>
        </Stack>
      </Container>,
    );
    const page = screen.getByTestId("page");
    const content = screen.getByTestId("content");
    expect(page.className).toContain("kui-container");
    expect(content.className).toContain("kui-stack");
    expect(page.contains(content)).toBe(true);
  });

  it("SSR renders full layout", () => {
    const html = renderToString(
      <Container maxWidth="lg">
        <Stack gap={16}>
          <Heading level={1}>Title</Heading>
          <Text as="p">Body</Text>
        </Stack>
      </Container>,
    );
    expect(html).toContain("kui-container");
    expect(html).toContain("kui-stack");
    expect(html).toContain("kui-heading");
    expect(html).toContain("kui-text");
    expect(html).toContain("<h1");
    expect(html).toContain("<p");
  });
});

// ─── Flex + Box ─────────────────────────────────────────────────────

describe("Composition: Flex + Box", () => {
  it("renders flex with box children", () => {
    render(
      <Flex data-testid="row" direction="row" gap={8} align="center">
        <Box data-testid="a">A</Box>
        <Box data-testid="b">B</Box>
      </Flex>,
    );
    expect(screen.getByTestId("row").className).toContain("kui-flex");
    expect(screen.getByTestId("a").className).toContain("kui-box");
    expect(screen.getByTestId("b").className).toContain("kui-box");
  });

  it("box does not interfere with flex child behavior", () => {
    render(
      <Flex data-testid="row" gap={16}>
        <Box data-testid="child" style={{ flex: 1 }}>
          Grow
        </Box>
      </Flex>,
    );
    expect(screen.getByTestId("child").style.flex).toContain("1");
  });
});

// ─── Grid + Surface ─────────────────────────────────────────────────

describe("Composition: Grid + Surface", () => {
  it("renders card grid pattern", () => {
    render(
      <Grid data-testid="grid" columns={3} gap={16}>
        <Surface data-testid="card1" elevation="sm">
          Card 1
        </Surface>
        <Surface data-testid="card2" elevation="sm">
          Card 2
        </Surface>
        <Surface data-testid="card3" elevation="sm">
          Card 3
        </Surface>
      </Grid>,
    );
    expect(screen.getByTestId("grid").className).toContain("kui-grid");
    expect(screen.getByTestId("card1").className).toContain("kui-surface");
    expect(screen.getByTestId("grid").children).toHaveLength(3);
  });
});

// ─── Heading + Text ─────────────────────────────────────────────────

describe("Composition: Heading + Text", () => {
  it("renders article pattern", () => {
    render(
      <Box as="article" data-testid="article">
        <Heading level={2} data-testid="title">
          Article Title
        </Heading>
        <Text as="p" data-testid="body">
          Article body text.
        </Text>
      </Box>,
    );
    expect(screen.getByTestId("article").tagName).toBe("ARTICLE");
    expect(screen.getByTestId("title").tagName).toBe("H2");
    expect(screen.getByTestId("body").tagName).toBe("P");
  });

  it("classes do not conflict", () => {
    render(
      <div>
        <Heading data-testid="h">Title</Heading>
        <Text data-testid="t">Body</Text>
      </div>,
    );
    expect(screen.getByTestId("h").className).not.toContain("kui-text");
    expect(screen.getByTestId("t").className).not.toContain("kui-heading");
  });
});

// ─── Surface + Stack + Divider ──────────────────────────────────────

describe("Composition: Surface + Stack + Divider", () => {
  it("renders card with sections pattern", () => {
    render(
      <Surface data-testid="card" elevation="md" radius="md">
        <Stack gap={12}>
          <Heading level={3}>Card Title</Heading>
          <Divider data-testid="div" />
          <Text as="p">Card content.</Text>
        </Stack>
      </Surface>,
    );
    expect(screen.getByTestId("card").className).toContain("kui-surface");
    expect(screen.getByTestId("div").tagName).toBe("HR");
  });
});

// ─── Center + Icon ──────────────────────────────────────────────────

describe("Composition: Center + Icon", () => {
  it("renders centered icon pattern", () => {
    render(
      <Center data-testid="wrap" style={{ width: "48px", height: "48px" }}>
        <Icon data-testid="icon" size="lg" label="Star">
          <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
        </Icon>
      </Center>,
    );
    expect(screen.getByTestId("wrap").className).toContain("kui-center");
    expect(screen.getByTestId("icon").getAttribute("aria-label")).toBe("Star");
  });
});

// ─── AspectRatio + Box ──────────────────────────────────────────────

describe("Composition: AspectRatio + Box", () => {
  it("renders media placeholder pattern", () => {
    render(
      <AspectRatio data-testid="aspect" ratio="16/9">
        <Box data-testid="media" style={{ background: "#eee", width: "100%", height: "100%" }}>
          Media content
        </Box>
      </AspectRatio>,
    );
    expect(screen.getByTestId("aspect").className).toContain("kui-aspect-ratio");
    expect(screen.getByTestId("media").className).toContain("kui-box");
  });
});

// ─── VisuallyHidden + Heading (accessible title pattern) ────────────

describe("Composition: VisuallyHidden + Heading", () => {
  it("renders hidden page title for accessibility", () => {
    render(
      <div>
        <VisuallyHidden data-testid="vh">
          <Heading level={1} data-testid="h">
            Dashboard
          </Heading>
        </VisuallyHidden>
        <Text data-testid="visible">Welcome back</Text>
      </div>,
    );
    expect(screen.getByTestId("vh").getAttribute("aria-hidden")).toBeNull();
    expect(screen.getByTestId("h").tagName).toBe("H1");
    expect(screen.getByTestId("visible").className).toContain("kui-text");
  });
});

// ─── Full page layout ───────────────────────────────────────────────

describe("Composition: full page layout", () => {
  it("renders complex realistic layout", () => {
    render(
      <Box data-testid="app">
        <Container maxWidth="xl">
          <Stack gap={32}>
            <Flex as="header" justify="between" align="center" data-testid="header">
              <Heading level={1}>App</Heading>
              <Flex gap={8}>
                <Icon size="sm" label="Search">
                  <circle cx="10" cy="10" r="7" />
                </Icon>
              </Flex>
            </Flex>
            <Divider />
            <Grid as="main" columns={3} gap={16} data-testid="main">
              <Surface elevation="sm">
                <Stack gap={8}>
                  <Heading level={3}>Card 1</Heading>
                  <Text as="p">Description</Text>
                </Stack>
              </Surface>
              <Surface elevation="sm">
                <Stack gap={8}>
                  <Heading level={3}>Card 2</Heading>
                  <Text as="p">Description</Text>
                </Stack>
              </Surface>
              <Surface elevation="sm">
                <Stack gap={8}>
                  <Heading level={3}>Card 3</Heading>
                  <Text as="p">Description</Text>
                </Stack>
              </Surface>
            </Grid>
            <Spacer size={24} />
            <Text as="footer" data-testid="footer">
              © 2026
            </Text>
          </Stack>
        </Container>
      </Box>,
    );
    expect(screen.getByTestId("app").className).toContain("kui-box");
    expect(screen.getByTestId("header").tagName).toBe("HEADER");
    expect(screen.getByTestId("main").tagName).toBe("MAIN");
    expect(screen.getByTestId("footer").tagName).toBe("FOOTER");
  });

  it("SSR full layout", () => {
    const html = renderToString(
      <Container maxWidth="lg">
        <Stack gap={16}>
          <Heading level={1}>Page</Heading>
          <Divider />
          <Grid columns={2} gap={12}>
            <Surface elevation="sm">
              <Text>A</Text>
            </Surface>
            <Surface elevation="sm">
              <Text>B</Text>
            </Surface>
          </Grid>
        </Stack>
      </Container>,
    );
    expect(html).toContain("kui-container");
    expect(html).toContain("kui-stack");
    expect(html).toContain("kui-heading");
    expect(html).toContain("kui-divider");
    expect(html).toContain("kui-grid");
    expect(html).toContain("kui-surface");
    expect(html).toContain("kui-text");
  });
});

// ─── Ref forwarding consistency ─────────────────────────────────────

describe("Composition: ref forwarding", () => {
  it("all primitives forward refs to DOM elements", () => {
    const refs = {
      box: createRef<HTMLDivElement>(),
      text: createRef<HTMLSpanElement>(),
      flex: createRef<HTMLDivElement>(),
      stack: createRef<HTMLDivElement>(),
      grid: createRef<HTMLDivElement>(),
      container: createRef<HTMLDivElement>(),
      surface: createRef<HTMLDivElement>(),
      divider: createRef<HTMLHRElement>(),
      spacer: createRef<HTMLDivElement>(),
      center: createRef<HTMLDivElement>(),
      aspectRatio: createRef<HTMLDivElement>(),
      visuallyHidden: createRef<HTMLSpanElement>(),
      icon: createRef<SVGSVGElement>(),
      heading: createRef<HTMLHeadingElement>(),
    };

    render(
      <div>
        <Box ref={refs.box} />
        <Text ref={refs.text}>T</Text>
        <Flex ref={refs.flex} />
        <Stack ref={refs.stack} />
        <Grid ref={refs.grid} />
        <Container ref={refs.container} />
        <Surface ref={refs.surface} />
        <Divider ref={refs.divider} />
        <Spacer ref={refs.spacer} />
        <Center ref={refs.center} />
        <AspectRatio ref={refs.aspectRatio} />
        <VisuallyHidden ref={refs.visuallyHidden}>VH</VisuallyHidden>
        <Icon ref={refs.icon} />
        <Heading ref={refs.heading}>H</Heading>
      </div>,
    );

    expect(refs.box.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.text.current).toBeInstanceOf(HTMLSpanElement);
    expect(refs.flex.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.stack.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.grid.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.container.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.surface.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.divider.current).toBeInstanceOf(HTMLHRElement);
    expect(refs.spacer.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.center.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.aspectRatio.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.visuallyHidden.current).toBeInstanceOf(HTMLSpanElement);
    expect(refs.icon.current).toBeInstanceOf(SVGSVGElement);
    expect(refs.heading.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

// ─── No class name conflicts ────────────────────────────────────────

describe("Composition: class isolation", () => {
  it("each primitive has unique class prefix", () => {
    render(
      <div>
        <Box data-testid="box" />
        <Text data-testid="text">T</Text>
        <Flex data-testid="flex" />
        <Stack data-testid="stack" />
        <Grid data-testid="grid" />
        <Container data-testid="container" />
        <Surface data-testid="surface" />
        <Divider data-testid="divider" />
        <Spacer data-testid="spacer" />
        <Center data-testid="center" />
        <AspectRatio data-testid="aspect" />
        <VisuallyHidden data-testid="vh">VH</VisuallyHidden>
        <Icon data-testid="icon" />
      </div>,
    );

    const classes = [
      screen.getByTestId("box").className,
      screen.getByTestId("text").className,
      screen.getByTestId("flex").className,
      screen.getByTestId("stack").className,
      screen.getByTestId("grid").className,
      screen.getByTestId("container").className,
      screen.getByTestId("surface").className,
      screen.getByTestId("divider").className,
      screen.getByTestId("spacer").className,
      screen.getByTestId("center").className,
      screen.getByTestId("aspect").className,
      screen.getByTestId("vh").className,
      screen.getByTestId("icon").getAttribute("class") ?? "",
    ];

    // All classes are unique (no primitive reuses another's class)
    const uniqueClasses = new Set(classes);
    expect(uniqueClasses.size).toBe(classes.length);
  });
});
