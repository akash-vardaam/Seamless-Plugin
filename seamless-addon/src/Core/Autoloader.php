<?php

namespace SeamlessAddon\Core;

/**
 * PSR-4 Autoloader for SeamlessAddon namespace.
 */
class Autoloader
{
    /**
     * Register the autoloader.
     */
    public static function register()
    {
        spl_autoload_register([__CLASS__, 'autoload']);
    }

    /**
     * Autoload classes.
     *
     * @param string $class The fully-qualified class name.
     */
    public static function autoload($class)
    {
        // Project-specific namespace prefix
        $prefix = 'SeamlessAddon\\';

        // Base directory for the namespace prefix
        $base_dir = SEAMLESS_ADDON_PLUGIN_DIR . 'src/';

        // Does the class use the namespace prefix?
        $len = strlen($prefix);
        if (strncmp($prefix, $class, $len) !== 0) {
            // No, move to the next registered autoloader
            return;
        }

        // Get the relative class name
        $relative_class = substr($class, $len);

        // Replace the namespace prefix with the base directory
        // Replace namespace separators with directory separators
        // Append with .php
        $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

        // If the file exists, require it
        if (file_exists($file)) {
            require $file;
        }
    }
}
