from django.db import models


class SkillReference(models.Model):
	"""Global catalog of known skills (e.g. Python, React).

	icon should point to an external icon URL (Devicon, SimpleIcons, etc.).
	"""
	name = models.CharField(max_length=100, unique=True)
	# short id used by skillicons (e.g. 'python', 'react')
	id_icon = models.CharField(max_length=100, blank=True, null=True)
	# URL to the icon service (constructed from `id_icon` when available)
	icon = models.URLField(blank=True, null=True)

	class Meta:
		ordering = ["name"]
		verbose_name = "Skill Reference"
		verbose_name_plural = "Skill References"

	def __str__(self):
		return self.name


class Skill(models.Model):
	"""Actual skill entries attached to the portfolio/user/etc.

	Minimal model: only a foreign key to the canonical SkillReference.
	"""
	reference = models.ForeignKey(SkillReference, on_delete=models.CASCADE, related_name="skills")

	class Meta:
		verbose_name = "Skill"
		verbose_name_plural = "Skills"

	def __str__(self):
		return f"{self.reference.name}"
