<?php
/**
 * Content restriction template.
 * Rendered when a post's required membership plans don't match the user's plans.
 */
get_header();

$purchase_url = esc_url( get_option( 'seamless_react_membership_purchase_url', '' ) );
$message = wp_kses_post( get_option( 'seamless_react_restriction_message', 'You must have an active membership to view this content.' ) );
$is_logged_in = (bool) get_query_var( 'seamless_react_is_logged_in', false );
?>

<div class="seamless-react-restriction-page" style="max-width:600px;margin:4rem auto;padding:0 1rem;text-align:center;font-family:sans-serif">
	<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" style="margin-bottom:1.5rem">
		<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
		<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
	</svg>

	<h1 style="font-size:1.5rem;color:#1e293b;margin:0 0 1rem">Members Only</h1>

	<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:.75rem;padding:1.5rem;color:#475569;line-height:1.75;margin-bottom:1.5rem">
		<?php echo $message; ?>
	</div>

	<?php if ( ! $is_logged_in ) : ?>
		<p>
			<a href="<?php echo esc_url( add_query_arg( 'sso_react_login', '1', home_url( '/' ) ) ); ?>" style="display:inline-block;padding:.65rem 1.75rem;background:#26337a;color:#fff;border-radius:.5rem;text-decoration:none;font-weight:600">
				Sign in with Seamless
			</a>
		</p>
	<?php endif; ?>

	<?php if ( $purchase_url ) : ?>
		<p style="margin-top:1rem">
			<a href="<?php echo $purchase_url; ?>" style="color:#06b6d4;font-weight:600;text-decoration:none">
				View membership plans →
			</a>
		</p>
	<?php endif; ?>

	<p style="margin-top:1.5rem">
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>" style="color:#64748b;font-size:.875rem;text-decoration:none">← Back to home</a>
	</p>
</div>

<?php get_footer();
