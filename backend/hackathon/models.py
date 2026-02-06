from django.db import models


class Crosswordpuzzlebank(models.Model):
    # Field name made lowercase.
    puzzleid = models.CharField(db_column='puzzleID', primary_key=True, max_length=20)
    # Field name made lowercase.
    blackboxarray = models.CharField(db_column='blackBoxArray', max_length=200, blank=True, null=True)
    # Field name made lowercase.
    accrosshintarray = models.TextField(db_column='accrossHintArray', blank=True, null=True)
    # Field name made lowercase.
    downhintarray = models.TextField(db_column='downHintArray', blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)
    # Field name made lowercase.
    createddate = models.DateTimeField(db_column='createdDate', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'crosswordpuzzlebank'


class Crosswordpuzzleresults(models.Model):
    id = models.AutoField(primary_key=True)
    puzzleid = models.CharField(db_column='puzzleID', max_length=40, blank=True, null=True)
    riderid = models.CharField(db_column='riderID', max_length=30, blank=True, null=True)
    submittedpuzzle = models.TextField(db_column='submittedPuzzle', blank=True, null=True)
    gamescore = models.CharField(db_column='gameScore', max_length=10, blank=True, null=True)
    duration = models.CharField(max_length=20, blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)
    createddate = models.DateTimeField(db_column='createdDate', blank=True, null=True)
    email = models.CharField(db_column='Email', max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'crosswordpuzzleresults'
