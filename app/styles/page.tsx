import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export default function StylesPage() {
  return (
    <div className={`${inter.variable} font-sans container mx-auto py-8 px-4 space-y-12`}>
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Design System</h1>
        <p className="text-xl text-muted-foreground">
          A comprehensive overview of FinBot's design system including colors, typography, and components.
        </p>
      </div>

      {/* Color Palette */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Color Palette</h2>
          <p className="text-muted-foreground">
            Our color system uses OKLCH color space for consistent, perceptually uniform colors across light and dark themes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Light Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Light Theme</CardTitle>
              <CardDescription>Primary color palette for light mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <ColorSwatch
                  name="Background"
                  value="oklch(1 0 0)"
                  className="bg-background border"
                  textColor="text-foreground"
                />
                <ColorSwatch
                  name="Foreground"
                  value="oklch(0.147 0.004 49.25)"
                  className="bg-foreground"
                  textColor="text-background"
                />
                <ColorSwatch
                  name="Primary"
                  value="oklch(0.216 0.006 56.043)"
                  className="bg-primary"
                  textColor="text-primary-foreground"
                />
                <ColorSwatch
                  name="Secondary"
                  value="oklch(0.97 0.001 106.424)"
                  className="bg-secondary border"
                  textColor="text-secondary-foreground"
                />
                <ColorSwatch
                  name="Muted"
                  value="oklch(0.97 0.001 106.424)"
                  className="bg-muted border"
                  textColor="text-muted-foreground"
                />
                <ColorSwatch
                  name="Accent"
                  value="oklch(0.97 0.001 106.424)"
                  className="bg-accent border"
                  textColor="text-accent-foreground"
                />
                <ColorSwatch
                  name="Destructive"
                  value="oklch(0.577 0.245 27.325)"
                  className="bg-destructive"
                  textColor="text-white"
                />
                <ColorSwatch
                  name="Border"
                  value="oklch(0.923 0.003 48.717)"
                  className="bg-border border-2 border-foreground"
                  textColor="text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dark Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Dark Theme</CardTitle>
              <CardDescription>Primary color palette for dark mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <ColorSwatch
                  name="Background"
                  value="oklch(0.147 0.004 49.25)"
                  className="bg-[oklch(0.147_0.004_49.25)]"
                  textColor="text-white"
                />
                <ColorSwatch
                  name="Foreground"
                  value="oklch(0.985 0.001 106.423)"
                  className="bg-[oklch(0.985_0.001_106.423)] border"
                  textColor="text-[oklch(0.147_0.004_49.25)]"
                />
                <ColorSwatch
                  name="Primary"
                  value="oklch(0.923 0.003 48.717)"
                  className="bg-[oklch(0.923_0.003_48.717)] border"
                  textColor="text-[oklch(0.216_0.006_56.043)]"
                />
                <ColorSwatch
                  name="Secondary"
                  value="oklch(0.268 0.007 34.298)"
                  className="bg-[oklch(0.268_0.007_34.298)]"
                  textColor="text-white"
                />
                <ColorSwatch
                  name="Muted"
                  value="oklch(0.268 0.007 34.298)"
                  className="bg-[oklch(0.268_0.007_34.298)]"
                  textColor="text-white"
                />
                <ColorSwatch
                  name="Accent"
                  value="oklch(0.268 0.007 34.298)"
                  className="bg-[oklch(0.268_0.007_34.298)]"
                  textColor="text-white"
                />
                <ColorSwatch
                  name="Destructive"
                  value="oklch(0.704 0.191 22.216)"
                  className="bg-[oklch(0.704_0.191_22.216)]"
                  textColor="text-white"
                />
                <ColorSwatch
                  name="Border"
                  value="oklch(1 0 0 / 10%)"
                  className="bg-[oklch(1_0_0_/_10%)] border-2 border-white"
                  textColor="text-white"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Chart Colors</CardTitle>
            <CardDescription>Color palette for data visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              <ColorSwatch
                name="Chart 1"
                value="oklch(0.646 0.222 41.116)"
                className="bg-chart-1"
                textColor="text-white"
              />
              <ColorSwatch
                name="Chart 2"
                value="oklch(0.6 0.118 184.704)"
                className="bg-chart-2"
                textColor="text-white"
              />
              <ColorSwatch
                name="Chart 3"
                value="oklch(0.398 0.07 227.392)"
                className="bg-chart-3"
                textColor="text-white"
              />
              <ColorSwatch
                name="Chart 4"
                value="oklch(0.828 0.189 84.429)"
                className="bg-chart-4"
                textColor="text-black"
              />
              <ColorSwatch
                name="Chart 5"
                value="oklch(0.769 0.188 70.08)"
                className="bg-chart-5"
                textColor="text-black"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Typography */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Typography</h2>
          <p className="text-muted-foreground">
            Typography scale using Inter and Geist Mono fonts with consistent spacing and hierarchy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Headings */}
          <Card>
            <CardHeader>
              <CardTitle>Headings</CardTitle>
              <CardDescription>Semantic heading hierarchy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Heading 1</h1>
                  <code className="text-xs text-muted-foreground">text-4xl font-bold tracking-tight</code>
                </div>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">Heading 2</h2>
                  <code className="text-xs text-muted-foreground">text-3xl font-semibold tracking-tight</code>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">Heading 3</h3>
                  <code className="text-xs text-muted-foreground">text-2xl font-semibold</code>
                </div>
                <div>
                  <h4 className="text-xl font-semibold">Heading 4</h4>
                  <code className="text-xs text-muted-foreground">text-xl font-semibold</code>
                </div>
                <div>
                  <h5 className="text-lg font-medium">Heading 5</h5>
                  <code className="text-xs text-muted-foreground">text-lg font-medium</code>
                </div>
                <div>
                  <h6 className="text-base font-medium">Heading 6</h6>
                  <code className="text-xs text-muted-foreground">text-base font-medium</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Body Text */}
          <Card>
            <CardHeader>
              <CardTitle>Body Text</CardTitle>
              <CardDescription>Text sizes and styles for content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <p className="text-xl">Large text for emphasis and important content</p>
                  <code className="text-xs text-muted-foreground">text-xl</code>
                </div>
                <div>
                  <p className="text-base">Base text size for regular body content and paragraphs</p>
                  <code className="text-xs text-muted-foreground">text-base</code>
                </div>
                <div>
                  <p className="text-sm">Small text for secondary information and metadata</p>
                  <code className="text-xs text-muted-foreground">text-sm</code>
                </div>
                <div>
                  <p className="text-xs">Extra small text for captions and fine print</p>
                  <code className="text-xs text-muted-foreground">text-xs</code>
                </div>
                <div>
                  <p className="text-muted-foreground">Muted text for less important information</p>
                  <code className="text-xs text-muted-foreground">text-muted-foreground</code>
                </div>
                <div>
                  <code className="font-mono text-sm bg-muted px-2 py-1 rounded">Monospace text for code</code>
                  <div><code className="text-xs text-muted-foreground">font-mono</code></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Components */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Components</h2>
          <p className="text-muted-foreground">
            Core UI components with consistent styling and behavior patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Button variants and sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium">Variants</h4>
                <div className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Sizes</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">⚙</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Input fields and form controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter your password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disabled">Disabled Input</Label>
                <Input id="disabled" disabled placeholder="This input is disabled" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Cards</CardTitle>
            <CardDescription>Card layouts and content organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Simple Card</CardTitle>
                  <CardDescription>Basic card with header and content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">This is a simple card with some content to demonstrate the card component structure.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Card with Footer</CardTitle>
                  <CardDescription>Card including footer section</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">This card includes a footer section for actions or additional information.</p>
                </CardContent>
                <div className="border-t px-6 py-4">
                  <Button size="sm" variant="outline">Action</Button>
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interactive Card</CardTitle>
                  <CardDescription>Card with interactive elements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="card-input">Input</Label>
                    <Input id="card-input" placeholder="Type something..." />
                  </div>
                  <Button size="sm" className="w-full">Submit</Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Spacing & Layout */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Spacing & Layout</h2>
          <p className="text-muted-foreground">
            Consistent spacing scale and layout patterns using Tailwind's spacing system.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Spacing Scale</CardTitle>
            <CardDescription>Standard spacing increments used throughout the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { size: '1', rem: '0.25rem', px: '4px' },
                { size: '2', rem: '0.5rem', px: '8px' },
                { size: '3', rem: '0.75rem', px: '12px' },
                { size: '4', rem: '1rem', px: '16px' },
                { size: '6', rem: '1.5rem', px: '24px' },
                { size: '8', rem: '2rem', px: '32px' },
                { size: '12', rem: '3rem', px: '48px' },
                { size: '16', rem: '4rem', px: '64px' },
              ].map((space) => (
                <div key={space.size} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-mono">{space.size}</div>
                  <div 
                    className="bg-primary h-4 rounded"
                    style={{ width: space.rem }}
                  />
                  <div className="text-sm text-muted-foreground">
                    {space.rem} ({space.px})
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Border Radius */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Border Radius</h2>
          <p className="text-muted-foreground">
            Consistent border radius values for cohesive component styling.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Radius Scale</CardTitle>
            <CardDescription>Standard border radius values with base radius of 0.625rem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary mx-auto rounded-sm"></div>
                <div className="text-sm font-mono">rounded-sm</div>
                <div className="text-xs text-muted-foreground">0.225rem</div>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary mx-auto rounded-md"></div>
                <div className="text-sm font-mono">rounded-md</div>
                <div className="text-xs text-muted-foreground">0.425rem</div>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary mx-auto rounded-lg"></div>
                <div className="text-sm font-mono">rounded-lg</div>
                <div className="text-xs text-muted-foreground">0.625rem</div>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary mx-auto rounded-xl"></div>
                <div className="text-sm font-mono">rounded-xl</div>
                <div className="text-xs text-muted-foreground">1.025rem</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

interface ColorSwatchProps {
  name: string
  value: string
  className: string
  textColor: string
}

function ColorSwatch({ name, value, className, textColor }: ColorSwatchProps) {
  return (
    <div className={`p-3 rounded-lg ${className}`}>
      <div className={`font-medium text-sm ${textColor}`}>{name}</div>
      <div className={`text-xs font-mono ${textColor} opacity-80`}>{value}</div>
    </div>
  )
} 