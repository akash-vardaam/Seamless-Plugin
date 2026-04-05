<?php
/**
 * Replaces do_shortcode render() in all Elementor widget files
 * with a direct React mount div output.
 */

$dir = __DIR__ . '/seamless-addons-react/plugin/src/Elementor/Widgets';
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));

$new_render_body = <<<'PHPCODE'
    protected function render() {
        $settings = $this->get_settings_for_display();

        // Derive the view name: "seamless-events-list" -> "events-list"
        $view = preg_replace('/^seamless[-_](react[-_])?/', '', $this->get_name());
        $view = str_replace('_', '-', $view);

        // Build data-* attributes from widget-specific settings only (skip Elementor internals)
        $skip_prefixes = ['_', 'eael_'];
        $data_attrs = 'data-seamless-view="' . esc_attr( $view ) . '"';
        foreach ( $settings as $key => $val ) {
            $skip = false;
            foreach ( $skip_prefixes as $pfx ) {
                if ( strncmp( $key, $pfx, strlen( $pfx ) ) === 0 ) {
                    $skip = true;
                    break;
                }
            }
            if ( $skip ) continue;
            if ( is_array( $val ) ) {
                $val = implode( ',', array_filter( array_map( 'strval', $val ) ) );
            }
            $data_attrs .= ' data-' . esc_attr( str_replace( '_', '-', $key ) ) . '="' . esc_attr( (string) $val ) . '"';
        }

        printf(
            '<div id="seamless-react-%s-%s" class="seamless-react-mount" %s></div>',
            esc_attr( $view ),
            esc_attr( wp_generate_uuid4() ),
            $data_attrs
        );
    }
PHPCODE;

$count = 0;
foreach ($files as $file) {
    if ($file->getExtension() !== 'php') continue;
    if ($file->getFilename() === 'BaseWidget.php') continue;

    $content = file_get_contents($file->getPathname());

    // Match the render() method that uses do_shortcode
    $pattern = '/(\s*\/\*\*\s*\*\s*Render widget output\.\s*\*\/\s*)?protected function render\(\)\s*\{.*?echo do_shortcode\([^;]+;\s*\}/s';

    if (preg_match($pattern, $content, $matches)) {
        // Replace only the method body, keeping the docblock if present
        $replacement = "\n    /**\n     * Render widget output.\n     */\n" . $new_render_body;
        $new_content = preg_replace($pattern, $replacement, $content);
        if ($new_content !== $content) {
            file_put_contents($file->getPathname(), $new_content);
            echo "Updated: " . $file->getFilename() . "\n";
            $count++;
        }
    }
}
echo "Done. Updated $count files.\n";
