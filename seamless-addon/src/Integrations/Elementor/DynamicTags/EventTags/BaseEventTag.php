<?php

namespace SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags;

use Elementor\Core\DynamicTags\Tag;

/**
 * Base Event Dynamic Tag
 * 
 * Base class for all event-related dynamic tags with API fetching.
 */
abstract class BaseEventTag extends Tag
{
    use EventDataTrait;
}
